// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@agrid/nuxt'],
  compatibilityDate: '2025-11-03',
  agridConfig: {
    host: process.env.AGRID_API_HOST!,
    publicKey: process.env.AGRID_PROJECT_API_KEY!,
    debug: true,
    clientConfig: {
      capture_exceptions: true,
      capture_pageview: 'history_change',
    },
    serverConfig: {
      enableExceptionAutocapture: true,
    },
    sourcemaps: {
      enabled: true,
      version: '3',
      logLevel: 'debug',
      envId: process.env.AGRID_API_PROJECT!,
      project: 'my-project',
      personalApiKey: process.env.AGRID_PERSONAL_API_KEY!,
    },
  },
})
