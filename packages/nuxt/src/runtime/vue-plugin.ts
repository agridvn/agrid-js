import { defineNuxtPlugin, useRuntimeConfig } from '#app'

import posthog from 'agrid-js'
import type { PostHogClientConfig, PostHogCommon } from '../module'

export default defineNuxtPlugin((nuxtApp: any) => {
  const runtimeConfig = useRuntimeConfig()
  const posthogCommon = runtimeConfig.public.posthog as PostHogCommon
  const posthogClientConfig = runtimeConfig.public.posthogClientConfig as PostHogClientConfig

  // prevent nitro from trying to load this
  if (typeof window === 'undefined' || posthog.__loaded) {
    return
  }

  posthog.init(posthogCommon.publicKey, {
    api_host: posthogCommon.host,
    ...posthogClientConfig,
  })

  if (posthogCommon.debug) {
    posthog.debug(true)
  }

  if (autocaptureEnabled(posthogClientConfig)) {
    nuxtApp.hook('vue:error', (error: any, info: any) => {
      posthog.captureException(error, { info })
    })
  }

  return {
    provide: {
      posthog: () => posthog,
    },
  }
})

function autocaptureEnabled(config: PostHogClientConfig): boolean {
  if (!config) return false
  if (typeof config.capture_exceptions === 'boolean') return config.capture_exceptions
  if (typeof config.capture_exceptions === 'object') return config.capture_exceptions.capture_unhandled_errors === true
  return false
}
