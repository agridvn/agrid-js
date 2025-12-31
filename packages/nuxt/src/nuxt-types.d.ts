import type { AgridCommon, AgridClientConfig, AgridServerConfig } from './module'

// Type declarations for Nuxt auto-imports
declare module '#imports' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function defineNuxtPlugin(plugin: (nuxtApp: any) => any): any
  export function useRuntimeConfig(): {
    public: {
      agrid: AgridCommon
      agridClientConfig: AgridClientConfig
    }
    agridServerConfig: AgridServerConfig
  }
}

declare module '#app' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function defineNuxtPlugin(plugin: (nuxtApp: any) => any): any
  export function useRuntimeConfig(): {
    public: {
      agrid: AgridCommon
      agridClientConfig: AgridClientConfig
    }
    agridServerConfig: AgridServerConfig
  }
}
