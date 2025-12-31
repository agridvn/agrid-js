import '@/styles/globals.css'

import type { AppProps } from 'next/app'
import { useEffect } from 'react'

import { CookieBanner } from '@/src/CookieBanner'
import { PageHeader } from '@/src/Header'
import { useUser } from '@/src/auth'
import { agrid, agridHelpers } from '@/src/agrid'
import Head from 'next/head'
import { AgridProvider } from 'agrid-js/react'

const CDP_DOMAINS = ['https://*.redditstatic.com', 'https://*.reddit.com'].join(' ')
const CHAT_DOMAINS = [
    'https://*.intercom.io',
    'https://*.intercomcdn.com',
    'wss://*.intercom.io',
    'https://static.intercomassets.com',
    'https://*.crisp.chat',
    'wss://*.relay.crisp.chat',
].join(' ')

export default function App({ Component, pageProps }: AppProps) {
    const user = useUser()
    useEffect(() => {
        // Use a type assertion to add the property to the window object
        ;(window as any).AGRID_DEBUG = true
        if (user) {
            agridHelpers.setUser(user)
        }
    }, [user])

    useEffect(() => {
        // make sure we initialize the WebSocket server
        // we don't need to support IE11 here
        // eslint-disable-next-line compat/compat
        fetch('/api/socket')
    }, [])

    const localhostDomain = process.env.NEXT_PUBLIC_CROSSDOMAIN
        ? 'https://localhost:8000'
        : process.env.NEXT_PUBLIC_AGRID_HOST

    return (
        <AgridProvider client={agrid}>
            <Head>
                <title>Agrid</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                {/* CSP - useful for testing our documented recommendations. NOTE: Unsafe is only needed for nextjs pre-loading */}
                <meta
                    httpEquiv="Content-Security-Policy"
                    content={`
                    default-src 'self';
                    connect-src 'self' ${localhostDomain} https://*.agrid.vn https://lottie.host ${CDP_DOMAINS} ${CHAT_DOMAINS};
                    script-src 'self' 'unsafe-eval' 'unsafe-inline' ${localhostDomain} https://*.agrid.vn ${CDP_DOMAINS} ${CHAT_DOMAINS};
                    style-src 'self' 'unsafe-inline' ${localhostDomain} https://*.agrid.vn ${CHAT_DOMAINS};
                    img-src 'self' data: blob: ${localhostDomain} https://*.agrid.vn https://lottie.host https://cataas.com ${CDP_DOMAINS} ${CHAT_DOMAINS};
                    worker-src 'self' blob: ${CHAT_DOMAINS};
                    font-src 'self' ${localhostDomain} https://*.agrid.vn ${CHAT_DOMAINS};
                    media-src 'self' ${localhostDomain} https://*.agrid.vn ${CHAT_DOMAINS};
                    frame-src 'self' ${localhostDomain} https://*.agrid.vn ${CHAT_DOMAINS};
                `}
                />
            </Head>

            <main className="max-w-full overflow-hidden">
                <PageHeader />
                <Component {...pageProps} />
                <CookieBanner />
            </main>
        </AgridProvider>
    )
}
