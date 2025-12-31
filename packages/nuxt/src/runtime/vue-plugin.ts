import { defineNuxtPlugin, useRuntimeConfig } from '#app'

import agrid from 'agrid-js'
import type { AgridClientConfig, AgridCommon } from '../module'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default defineNuxtPlugin((nuxtApp: any) => {
  const runtimeConfig = useRuntimeConfig()
  const agridCommon = runtimeConfig.public.agrid as AgridCommon
  const agridClientConfig = runtimeConfig.public.agridClientConfig as AgridClientConfig

  // prevent nitro from trying to load this
  if (typeof window === 'undefined' || agrid.__loaded) {
    return
  }

  agrid.init(agridCommon.publicKey, {
    api_host: agridCommon.host,
    ...agridClientConfig,
  })

  if (agridCommon.debug) {
    agrid.debug(true)
  }

  if (autocaptureEnabled(agridClientConfig)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nuxtApp.hook('vue:error', (error: any, info: any) => {
      agrid.captureException(error, { info })
    })
  }

  return {
    provide: {
      agrid: () => agrid,
    },
  }
})

function autocaptureEnabled(config: AgridClientConfig): boolean {
  if (!config) return false
  if (typeof config.capture_exceptions === 'boolean') return config.capture_exceptions
  if (typeof config.capture_exceptions === 'object') return config.capture_exceptions.capture_unhandled_errors === true
  return false
}
