// Keep in sync with https://github.com/PostHog/agrid.com/blob/master/contents/docs/integrate/_snippets/install-nuxt.mdx
export default defineNuxtConfig({
    runtimeConfig: {
        public: {
            agridPublicKey: process.env.NUXT_PUBLIC_AGRID_KEY || '<ph_project_api_key>',
            agridHost: process.env.NUXT_PUBLIC_AGRID_HOST || '<ph_client_api_host>',
        },
    },

    compatibilityDate: '2025-03-04',
})
