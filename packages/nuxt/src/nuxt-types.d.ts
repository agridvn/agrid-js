// Type declarations for Nuxt auto-imports
declare module '#imports' {
  export function defineNuxtPlugin(plugin: (nuxtApp: any) => any): any
  export function useRuntimeConfig(): {
    public: {
      posthog: any
      posthogClientConfig: any
    }
    posthogServerConfig: any
  }
}

declare module '#app' {
  export function defineNuxtPlugin(plugin: (nuxtApp: any) => any): any
  export function useRuntimeConfig(): {
    public: {
      posthog: any
      posthogClientConfig: any
    }
    posthogServerConfig: any
  }
}

