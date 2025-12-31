'use client'

import { AgridConfig } from 'agrid-js'
import { AgridProvider } from 'agrid-js/react'

const agridConfig: Partial<AgridConfig> = {
    api_host: process.env.NEXT_PUBLIC_AGRID_API_HOST,
    debug: process.env.NODE_ENV === 'development',
}

export default function PHProvider({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <AgridProvider apiKey={process.env.NEXT_PUBLIC_AGRID_PROJECT_KEY!} options={agridConfig}>
            {children}
        </AgridProvider>
    )
}
