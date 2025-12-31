// Keep in sync with https://github.com/Agrid/agrid.com/blob/master/contents/docs/integrate/_snippets/install-nuxt.mdx
import { defineNuxtPlugin, useRuntimeConfig } from '#imports'

import agrid from 'agrid-js'
export default defineNuxtPlugin(() => {
    const runtimeConfig = useRuntimeConfig()
    const agridClient = agrid.init(runtimeConfig.public.agridPublicKey, {
        api_host: runtimeConfig.public.agridHost,
        capture_pageview: 'history_change',
        loaded: (agrid) => {
            if (import.meta.env.MODE === 'development') agrid.debug()
        },
    })

    return {
        provide: {
            agrid: () => agridClient,
        },
    }
})
