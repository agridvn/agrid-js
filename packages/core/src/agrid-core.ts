import type {
  AgridAutocaptureElement,
  AgridFlagsResponse,
  AgridCoreOptions,
  AgridEventProperties,
  AgridCaptureOptions,
  JsonType,
  AgridRemoteConfig,
  FeatureFlagValue,
  AgridV2FlagsResponse,
  AgridV1FlagsResponse,
  AgridFeatureFlagDetails,
  AgridFlagsStorageFormat,
  FeatureFlagDetail,
  Survey,
  SurveyResponse,
  AgridGroupProperties,
} from './types'
import {
  createFlagsResponseFromFlagsAndPayloads,
  getFeatureFlagValue,
  getFlagValuesFromFlags,
  getPayloadsFromFlags,
  normalizeFlagsResponse,
  updateFlagValue,
} from './featureFlagUtils'
import { Compression, AgridPersistedProperty } from './types'
import { maybeAdd, AgridCoreStateless, QuotaLimitedFeature } from './agrid-core-stateless'
import { uuidv7 } from './vendor/uuidv7'
import { isPlainError } from './utils'

export abstract class AgridCore extends AgridCoreStateless {
  // options
  private sendFeatureFlagEvent: boolean
  private flagCallReported: { [key: string]: boolean } = {}
  private _shutdownPromise: Promise<void> | null = null

  // internal
  protected _flagsResponsePromise?: Promise<AgridFlagsResponse | undefined>
  protected _sessionExpirationTimeSeconds: number
  private _sessionMaxLengthSeconds: number = 24 * 60 * 60
  protected sessionProps: AgridEventProperties = {}

  constructor(apiKey: string, options?: AgridCoreOptions) {
    const disableGeoipOption = options?.disableGeoip ?? false
    const featureFlagsRequestTimeoutMs = options?.featureFlagsRequestTimeoutMs ?? 10000
    super(apiKey, { ...options, disableGeoip: disableGeoipOption, featureFlagsRequestTimeoutMs })
    this.sendFeatureFlagEvent = options?.sendFeatureFlagEvent ?? true
    this._sessionExpirationTimeSeconds = options?.sessionExpirationTimeSeconds ?? 1800
  }

  protected setupBootstrap(options?: Partial<AgridCoreOptions>): void {
    const bootstrap = options?.bootstrap
    if (!bootstrap) {
      return
    }

    if (bootstrap.distinctId) {
      if (bootstrap.isIdentifiedId) {
        const distinctId = this.getPersistedProperty(AgridPersistedProperty.DistinctId)

        if (!distinctId) {
          this.setPersistedProperty(AgridPersistedProperty.DistinctId, bootstrap.distinctId)
        }
      } else {
        const anonymousId = this.getPersistedProperty(AgridPersistedProperty.AnonymousId)

        if (!anonymousId) {
          this.setPersistedProperty(AgridPersistedProperty.AnonymousId, bootstrap.distinctId)
        }
      }
    }

    const bootstrapFeatureFlags = bootstrap.featureFlags
    const bootstrapFeatureFlagPayloads = bootstrap.featureFlagPayloads ?? {}
    if (bootstrapFeatureFlags && Object.keys(bootstrapFeatureFlags).length) {
      const normalizedBootstrapFeatureFlagDetails = createFlagsResponseFromFlagsAndPayloads(
        bootstrapFeatureFlags,
        bootstrapFeatureFlagPayloads
      )

      if (Object.keys(normalizedBootstrapFeatureFlagDetails.flags).length > 0) {
        this.setBootstrappedFeatureFlagDetails(normalizedBootstrapFeatureFlagDetails)

        const currentFeatureFlagDetails = this.getKnownFeatureFlagDetails() || { flags: {}, requestId: undefined }
        const newFeatureFlagDetails = {
          flags: {
            ...normalizedBootstrapFeatureFlagDetails.flags,
            ...currentFeatureFlagDetails.flags,
          },
          requestId: normalizedBootstrapFeatureFlagDetails.requestId,
        }

        this.setKnownFeatureFlagDetails(newFeatureFlagDetails)
      }
    }
  }

  private clearProps(): void {
    this.props = undefined
    this.sessionProps = {}
    this.flagCallReported = {}
  }

  on(event: string, cb: (...args: any[]) => void): () => void {
    return this._events.on(event, cb)
  }

  reset(propertiesToKeep?: AgridPersistedProperty[]): void {
    this.wrap(() => {
      const allPropertiesToKeep = [AgridPersistedProperty.Queue, ...(propertiesToKeep || [])]

      this.clearProps()

      for (const key of <(keyof typeof AgridPersistedProperty)[]>Object.keys(AgridPersistedProperty)) {
        if (!allPropertiesToKeep.includes(AgridPersistedProperty[key])) {
          this.setPersistedProperty((AgridPersistedProperty as any)[key], null)
        }
      }

      this.reloadFeatureFlags()
    })
  }

  protected getCommonEventProperties(): AgridEventProperties {
    const featureFlags = this.getFeatureFlags()

    const featureVariantProperties: Record<string, FeatureFlagValue> = {}
    if (featureFlags) {
      for (const [feature, variant] of Object.entries(featureFlags)) {
        featureVariantProperties[`$feature/${feature}`] = variant
      }
    }
    return {
      ...maybeAdd('$active_feature_flags', featureFlags ? Object.keys(featureFlags) : undefined),
      ...featureVariantProperties,
      ...super.getCommonEventProperties(),
    }
  }

  private enrichProperties(properties?: AgridEventProperties): AgridEventProperties {
    return {
      ...this.props,
      ...this.sessionProps,
      ...(properties || {}),
      ...this.getCommonEventProperties(),
      $session_id: this.getSessionId(),
    }
  }

  getSessionId(): string {
    if (!this._isInitialized) {
      return ''
    }

    let sessionId = this.getPersistedProperty<string>(AgridPersistedProperty.SessionId)
    const sessionLastTimestamp = this.getPersistedProperty<number>(AgridPersistedProperty.SessionLastTimestamp) || 0
    const sessionStartTimestamp = this.getPersistedProperty<number>(AgridPersistedProperty.SessionStartTimestamp) || 0
    const now = Date.now()
    const sessionLastDif = now - sessionLastTimestamp
    const sessionStartDif = now - sessionStartTimestamp
    if (
      !sessionId ||
      sessionLastDif > this._sessionExpirationTimeSeconds * 1000 ||
      sessionStartDif > this._sessionMaxLengthSeconds * 1000
    ) {
      sessionId = uuidv7()
      this.setPersistedProperty(AgridPersistedProperty.SessionId, sessionId)
      this.setPersistedProperty(AgridPersistedProperty.SessionStartTimestamp, now)
    }
    this.setPersistedProperty(AgridPersistedProperty.SessionLastTimestamp, now)

    return sessionId
  }

  resetSessionId(): void {
    this.wrap(() => {
      this.setPersistedProperty(AgridPersistedProperty.SessionId, null)
      this.setPersistedProperty(AgridPersistedProperty.SessionLastTimestamp, null)
      this.setPersistedProperty(AgridPersistedProperty.SessionStartTimestamp, null)
    })
  }

  getAnonymousId(): string {
    if (!this._isInitialized) {
      return ''
    }

    let anonId = this.getPersistedProperty<string>(AgridPersistedProperty.AnonymousId)
    if (!anonId) {
      anonId = uuidv7()
      this.setPersistedProperty(AgridPersistedProperty.AnonymousId, anonId)
    }
    return anonId
  }

  getDistinctId(): string {
    if (!this._isInitialized) {
      return ''
    }

    return this.getPersistedProperty<string>(AgridPersistedProperty.DistinctId) || this.getAnonymousId()
  }

  registerForSession(properties: AgridEventProperties): void {
    this.sessionProps = {
      ...this.sessionProps,
      ...properties,
    }
  }

  unregisterForSession(property: string): void {
    delete this.sessionProps[property]
  }

  identify(distinctId?: string, properties?: AgridEventProperties, options?: AgridCaptureOptions): void {
    this.wrap(() => {
      const previousDistinctId = this.getDistinctId()
      distinctId = distinctId || previousDistinctId

      if (properties?.$groups) {
        this.groups(properties.$groups as AgridGroupProperties)
      }

      const userPropsOnce = properties?.$set_once
      delete properties?.$set_once

      const userProps = properties?.$set || properties

      const allProperties = this.enrichProperties({
        $anon_distinct_id: this.getAnonymousId(),
        ...maybeAdd('$set', userProps),
        ...maybeAdd('$set_once', userPropsOnce),
      })

      if (distinctId !== previousDistinctId) {
        this.setPersistedProperty(AgridPersistedProperty.AnonymousId, previousDistinctId)
        this.setPersistedProperty(AgridPersistedProperty.DistinctId, distinctId)
        this.reloadFeatureFlags()
      }

      super.identifyStateless(distinctId, allProperties, options)
    })
  }

  capture(event: string, properties?: AgridEventProperties, options?: AgridCaptureOptions): void {
    this.wrap(() => {
      const distinctId = this.getDistinctId()

      if (properties?.$groups) {
        this.groups(properties.$groups as AgridGroupProperties)
      }

      const allProperties = this.enrichProperties(properties)

      super.captureStateless(distinctId, event, allProperties, options)
    })
  }

  alias(alias: string): void {
    this.wrap(() => {
      const distinctId = this.getDistinctId()
      const allProperties = this.enrichProperties({})

      super.aliasStateless(alias, distinctId, allProperties)
    })
  }

  autocapture(
    eventType: string,
    elements: AgridAutocaptureElement[],
    properties: AgridEventProperties = {},
    options?: AgridCaptureOptions
  ): void {
    this.wrap(() => {
      const distinctId = this.getDistinctId()
      const payload = {
        distinct_id: distinctId,
        event: '$autocapture',
        properties: {
          ...this.enrichProperties(properties),
          $event_type: eventType,
          $elements: elements,
        },
      }

      this.enqueue('autocapture', payload, options)
    })
  }

  groups(groups: AgridGroupProperties): void {
    this.wrap(() => {
      const existingGroups = this.props.$groups || {}

      this.register({
        $groups: {
          ...(existingGroups as AgridGroupProperties),
          ...groups,
        },
      })

      if (Object.keys(groups).find((type) => existingGroups[type as keyof typeof existingGroups] !== groups[type])) {
        this.reloadFeatureFlags()
      }
    })
  }

  group(
    groupType: string,
    groupKey: string | number,
    groupProperties?: AgridEventProperties,
    options?: AgridCaptureOptions
  ): void {
    this.wrap(() => {
      this.groups({
        [groupType]: groupKey,
      })

      if (groupProperties) {
        this.groupIdentify(groupType, groupKey, groupProperties, options)
      }
    })
  }

  groupIdentify(
    groupType: string,
    groupKey: string | number,
    groupProperties?: AgridEventProperties,
    options?: AgridCaptureOptions
  ): void {
    this.wrap(() => {
      const distinctId = this.getDistinctId()
      const eventProperties = this.enrichProperties({})
      super.groupIdentifyStateless(groupType, groupKey, groupProperties, options, distinctId, eventProperties)
    })
  }

  setPersonPropertiesForFlags(properties: { [type: string]: string }): void {
    this.wrap(() => {
      const existingProperties =
        this.getPersistedProperty<Record<string, string>>(AgridPersistedProperty.PersonProperties) || {}

      this.setPersistedProperty<AgridEventProperties>(AgridPersistedProperty.PersonProperties, {
        ...existingProperties,
        ...properties,
      })
    })
  }

  resetPersonPropertiesForFlags(): void {
    this.wrap(() => {
      this.setPersistedProperty<AgridEventProperties>(AgridPersistedProperty.PersonProperties, null)
    })
  }

  setGroupPropertiesForFlags(properties: { [type: string]: Record<string, string> }): void {
    this.wrap(() => {
      const existingProperties =
        this.getPersistedProperty<Record<string, Record<string, string>>>(AgridPersistedProperty.GroupProperties) || {}

      if (Object.keys(existingProperties).length !== 0) {
        Object.keys(existingProperties).forEach((groupType) => {
          existingProperties[groupType] = {
            ...existingProperties[groupType],
            ...properties[groupType],
          }
          delete properties[groupType]
        })
      }

      this.setPersistedProperty<AgridEventProperties>(AgridPersistedProperty.GroupProperties, {
        ...existingProperties,
        ...properties,
      })
    })
  }

  resetGroupPropertiesForFlags(): void {
    this.wrap(() => {
      this.setPersistedProperty<AgridEventProperties>(AgridPersistedProperty.GroupProperties, null)
    })
  }

  private async remoteConfigAsync(): Promise<AgridRemoteConfig | undefined> {
    await this._initPromise
    if (this._remoteConfigResponsePromise) {
      return this._remoteConfigResponsePromise
    }
    return this._remoteConfigAsync()
  }

  protected async flagsAsync(
    sendAnonDistinctId: boolean = true,
    fetchConfig: boolean = true
  ): Promise<AgridFlagsResponse | undefined> {
    await this._initPromise
    if (this._flagsResponsePromise) {
      return this._flagsResponsePromise
    }
    return this._flagsAsync(sendAnonDistinctId, fetchConfig)
  }

  private cacheSessionReplay(source: string, response?: AgridRemoteConfig): void {
    const sessionReplay = response?.sessionRecording
    if (sessionReplay) {
      this.setPersistedProperty(AgridPersistedProperty.SessionReplay, sessionReplay)
      this._logger.info(`Session replay config from ${source}: `, JSON.stringify(sessionReplay))
    } else if (typeof sessionReplay === 'boolean' && sessionReplay === false) {
      this._logger.info(`Session replay config from ${source} disabled.`)
      this.setPersistedProperty(AgridPersistedProperty.SessionReplay, null)
    }
  }

  private async _remoteConfigAsync(): Promise<AgridRemoteConfig | undefined> {
    this._remoteConfigResponsePromise = this._initPromise
      .then(() => {
        let remoteConfig = this.getPersistedProperty<Omit<AgridRemoteConfig, 'surveys'>>(
          AgridPersistedProperty.RemoteConfig
        )

        this._logger.info('Cached remote config: ', JSON.stringify(remoteConfig))

        return super.getRemoteConfig().then((response) => {
          if (response) {
            const remoteConfigWithoutSurveys = { ...response }
            delete remoteConfigWithoutSurveys.surveys

            this._logger.info('Fetched remote config: ', JSON.stringify(remoteConfigWithoutSurveys))

            if (this.disableSurveys === false) {
              const surveys = response.surveys

              let hasSurveys = true

              if (!Array.isArray(surveys)) {
                this._logger.info('There are no surveys.')
                hasSurveys = false
              } else {
                this._logger.info('Surveys fetched from remote config: ', JSON.stringify(surveys))
              }

              if (hasSurveys) {
                this.setPersistedProperty<SurveyResponse['surveys']>(
                  AgridPersistedProperty.Surveys,
                  surveys as Survey[]
                )
              } else {
                this.setPersistedProperty<SurveyResponse['surveys']>(AgridPersistedProperty.Surveys, null)
              }
            } else {
              this.setPersistedProperty<SurveyResponse['surveys']>(AgridPersistedProperty.Surveys, null)
            }
            this.setPersistedProperty<Omit<AgridRemoteConfig, 'surveys'>>(
              AgridPersistedProperty.RemoteConfig,
              remoteConfigWithoutSurveys
            )

            this.cacheSessionReplay('remote config', response)

            if (response.hasFeatureFlags === false) {
              this.setKnownFeatureFlagDetails({ flags: {} })
              this._logger.warn('Remote config has no feature flags, will not load feature flags.')
            } else if (this.preloadFeatureFlags !== false) {
              this.reloadFeatureFlags()
            }

            if (!response.supportedCompression?.includes(Compression.GZipJS)) {
              this.disableCompression = true
            }

            remoteConfig = response
          }

          return remoteConfig
        })
      })
      .finally(() => {
        this._remoteConfigResponsePromise = undefined
      })
    return this._remoteConfigResponsePromise
  }

  private async _flagsAsync(
    sendAnonDistinctId: boolean = true,
    fetchConfig: boolean = true
  ): Promise<AgridFlagsResponse | undefined> {
    this._flagsResponsePromise = this._initPromise
      .then(async () => {
        const distinctId = this.getDistinctId()
        const groups = this.props.$groups || {}
        const personProperties =
          this.getPersistedProperty<Record<string, string>>(AgridPersistedProperty.PersonProperties) || {}
        const groupProperties =
          this.getPersistedProperty<Record<string, Record<string, string>>>(AgridPersistedProperty.GroupProperties) ||
          {}

        const extraProperties = {
          $anon_distinct_id: sendAnonDistinctId ? this.getAnonymousId() : undefined,
        }

        const res = await super.getFlags(
          distinctId,
          groups as AgridGroupProperties,
          personProperties,
          groupProperties,
          extraProperties,
          fetchConfig
        )
        if (res?.quotaLimited?.includes(QuotaLimitedFeature.FeatureFlags)) {
          this.setKnownFeatureFlagDetails(null)
          console.warn(
            '[FEATURE FLAGS] Feature flags quota limit exceeded - unsetting all flags. Learn more about billing limits at https://posthog.com/docs/billing/limits-alerts'
          )
          return res
        }
        if (res?.featureFlags) {
          if (this.sendFeatureFlagEvent) {
            this.flagCallReported = {}
          }

          let newFeatureFlagDetails = res
          if (res.errorsWhileComputingFlags) {
            const currentFlagDetails = this.getKnownFeatureFlagDetails()
            this._logger.info('Cached feature flags: ', JSON.stringify(currentFlagDetails))

            newFeatureFlagDetails = {
              ...res,
              flags: { ...currentFlagDetails?.flags, ...res.flags },
            }
          }
          this.setKnownFeatureFlagDetails(newFeatureFlagDetails)
          this.setPersistedProperty(AgridPersistedProperty.FlagsEndpointWasHit, true)
          this.cacheSessionReplay('flags', res)
        }
        return res
      })
      .finally(() => {
        this._flagsResponsePromise = undefined
      })
    return this._flagsResponsePromise
  }

  private setKnownFeatureFlagDetails(flagsResponse: AgridFlagsStorageFormat | null): void {
    this.wrap(() => {
      this.setPersistedProperty<AgridFlagsStorageFormat>(AgridPersistedProperty.FeatureFlagDetails, flagsResponse)

      this._events.emit('featureflags', getFlagValuesFromFlags(flagsResponse?.flags ?? {}))
    })
  }

  private getKnownFeatureFlagDetails(): AgridFeatureFlagDetails | undefined {
    const storedDetails = this.getPersistedProperty<AgridFlagsStorageFormat>(AgridPersistedProperty.FeatureFlagDetails)
    if (!storedDetails) {
      const featureFlags = this.getPersistedProperty<AgridFlagsResponse['featureFlags']>(
        AgridPersistedProperty.FeatureFlags
      )
      const featureFlagPayloads = this.getPersistedProperty<AgridFlagsResponse['featureFlagPayloads']>(
        AgridPersistedProperty.FeatureFlagPayloads
      )

      if (featureFlags === undefined && featureFlagPayloads === undefined) {
        return undefined
      }

      return createFlagsResponseFromFlagsAndPayloads(featureFlags ?? {}, featureFlagPayloads ?? {})
    }

    return normalizeFlagsResponse(
      storedDetails as AgridV1FlagsResponse | AgridV2FlagsResponse
    ) as AgridFeatureFlagDetails
  }

  protected getKnownFeatureFlags(): AgridFlagsResponse['featureFlags'] | undefined {
    const featureFlagDetails = this.getKnownFeatureFlagDetails()
    if (!featureFlagDetails) {
      return undefined
    }
    return getFlagValuesFromFlags(featureFlagDetails.flags)
  }

  private getKnownFeatureFlagPayloads(): AgridFlagsResponse['featureFlagPayloads'] | undefined {
    const featureFlagDetails = this.getKnownFeatureFlagDetails()
    if (!featureFlagDetails) {
      return undefined
    }
    return getPayloadsFromFlags(featureFlagDetails.flags)
  }

  private getBootstrappedFeatureFlagDetails(): AgridFeatureFlagDetails | undefined {
    const details = this.getPersistedProperty<AgridFeatureFlagDetails>(
      AgridPersistedProperty.BootstrapFeatureFlagDetails
    )
    if (!details) {
      return undefined
    }
    return details
  }

  private setBootstrappedFeatureFlagDetails(details: AgridFeatureFlagDetails): void {
    this.setPersistedProperty<AgridFeatureFlagDetails>(AgridPersistedProperty.BootstrapFeatureFlagDetails, details)
  }

  private getBootstrappedFeatureFlags(): AgridFlagsResponse['featureFlags'] | undefined {
    const details = this.getBootstrappedFeatureFlagDetails()
    if (!details) {
      return undefined
    }
    return getFlagValuesFromFlags(details.flags)
  }

  private getBootstrappedFeatureFlagPayloads(): AgridFlagsResponse['featureFlagPayloads'] | undefined {
    const details = this.getBootstrappedFeatureFlagDetails()
    if (!details) {
      return undefined
    }
    return getPayloadsFromFlags(details.flags)
  }

  getFeatureFlag(key: string): FeatureFlagValue | undefined {
    const details = this.getFeatureFlagDetails()

    if (!details) {
      return undefined
    }

    const featureFlag = details.flags[key]

    let response = getFeatureFlagValue(featureFlag)

    if (response === undefined) {
      response = false
    }

    if (this.sendFeatureFlagEvent && !this.flagCallReported[key]) {
      const bootstrappedResponse = this.getBootstrappedFeatureFlags()?.[key]
      const bootstrappedPayload = this.getBootstrappedFeatureFlagPayloads()?.[key]

      this.flagCallReported[key] = true
      this.capture('$feature_flag_called', {
        $feature_flag: key,
        $feature_flag_response: response,
        ...maybeAdd('$feature_flag_id', featureFlag?.metadata?.id),
        ...maybeAdd('$feature_flag_version', featureFlag?.metadata?.version),
        ...maybeAdd('$feature_flag_reason', featureFlag?.reason?.description ?? featureFlag?.reason?.code),
        ...maybeAdd('$feature_flag_bootstrapped_response', bootstrappedResponse),
        ...maybeAdd('$feature_flag_bootstrapped_payload', bootstrappedPayload),
        $used_bootstrap_value: !this.getPersistedProperty(AgridPersistedProperty.FlagsEndpointWasHit),
        ...maybeAdd('$feature_flag_request_id', details.requestId),
      })
    }

    return response
  }

  getFeatureFlagPayload(key: string): JsonType | undefined {
    const payloads = this.getFeatureFlagPayloads()

    if (!payloads) {
      return undefined
    }

    const response = payloads[key]

    if (response === undefined) {
      return null
    }

    return response
  }

  getFeatureFlagPayloads(): AgridFlagsResponse['featureFlagPayloads'] | undefined {
    return this.getFeatureFlagDetails()?.featureFlagPayloads
  }

  getFeatureFlags(): AgridFlagsResponse['featureFlags'] | undefined {
    return this.getFeatureFlagDetails()?.featureFlags
  }

  getFeatureFlagDetails(): AgridFeatureFlagDetails | undefined {
    let details = this.getKnownFeatureFlagDetails()
    const overriddenFlags = this.getPersistedProperty<AgridFlagsResponse['featureFlags']>(
      AgridPersistedProperty.OverrideFeatureFlags
    )

    if (!overriddenFlags) {
      return details
    }

    details = details ?? { featureFlags: {}, featureFlagPayloads: {}, flags: {} }

    const flags: Record<string, FeatureFlagDetail> = details.flags ?? {}

    for (const key in overriddenFlags) {
      if (!overriddenFlags[key]) {
        delete flags[key]
      } else {
        flags[key] = updateFlagValue(flags[key], overriddenFlags[key])
      }
    }

    const result = {
      ...details,
      flags,
    }

    return normalizeFlagsResponse(result) as AgridFeatureFlagDetails
  }

  getFeatureFlagsAndPayloads(): {
    flags: AgridFlagsResponse['featureFlags'] | undefined
    payloads: AgridFlagsResponse['featureFlagPayloads'] | undefined
  } {
    const flags = this.getFeatureFlags()
    const payloads = this.getFeatureFlagPayloads()

    return {
      flags,
      payloads,
    }
  }

  isFeatureEnabled(key: string): boolean | undefined {
    const response = this.getFeatureFlag(key)
    if (response === undefined) {
      return undefined
    }
    return !!response
  }

  reloadFeatureFlags(options?: { cb?: (err?: Error, flags?: AgridFlagsResponse['featureFlags']) => void }): void {
    this.flagsAsync(true)
      .then((res) => {
        options?.cb?.(undefined, res?.featureFlags)
      })
      .catch((e) => {
        options?.cb?.(e, undefined)
        if (!options?.cb) {
          this._logger.info('Error reloading feature flags', e)
        }
      })
  }

  async reloadRemoteConfigAsync(): Promise<AgridRemoteConfig | undefined> {
    return await this.remoteConfigAsync()
  }

  async reloadFeatureFlagsAsync(sendAnonDistinctId?: boolean): Promise<AgridFlagsResponse['featureFlags'] | undefined> {
    return (await this.flagsAsync(sendAnonDistinctId ?? true))?.featureFlags
  }

  onFeatureFlags(cb: (flags: AgridFlagsResponse['featureFlags']) => void): () => void {
    return this.on('featureflags', async () => {
      const flags = this.getFeatureFlags()
      if (flags) {
        cb(flags)
      }
    })
  }

  onFeatureFlag(key: string, cb: (value: FeatureFlagValue) => void): () => void {
    return this.on('featureflags', async () => {
      const flagResponse = this.getFeatureFlag(key)
      if (flagResponse !== undefined) {
        cb(flagResponse)
      }
    })
  }

  async overrideFeatureFlag(flags: AgridFlagsResponse['featureFlags'] | null): Promise<void> {
    this.wrap(() => {
      if (flags === null) {
        return this.setPersistedProperty(AgridPersistedProperty.OverrideFeatureFlags, null)
      }
      return this.setPersistedProperty(AgridPersistedProperty.OverrideFeatureFlags, flags)
    })
  }

  captureException(error: unknown, additionalProperties?: AgridEventProperties): void {
    const properties: { [key: string]: any } = {
      $exception_level: 'error',
      $exception_list: [
        {
          type: isPlainError(error) ? error.name : 'Error',
          value: isPlainError(error) ? error.message : error,
          mechanism: {
            handled: true,
            synthetic: false,
          },
        },
      ],
      ...additionalProperties,
    }

    this.capture('$exception', properties)
  }

  captureTraceFeedback(traceId: string | number, userFeedback: string): void {
    this.capture('$ai_feedback', {
      $ai_feedback_text: userFeedback,
      $ai_trace_id: String(traceId),
    })
  }

  captureTraceMetric(traceId: string | number, metricName: string, metricValue: string | number | boolean): void {
    this.capture('$ai_metric', {
      $ai_metric_name: metricName,
      $ai_metric_value: String(metricValue),
      $ai_trace_id: String(traceId),
    })
  }

  async shutdown(shutdownTimeoutMs: number = 30000): Promise<void> {
    if (this._shutdownPromise) {
      return this._shutdownPromise
    }
    this._shutdownPromise = this._shutdown(shutdownTimeoutMs).finally(() => {
      this._shutdownPromise = null
    })
    return this._shutdownPromise
  }
}
