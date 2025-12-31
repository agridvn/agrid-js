'use client'

import agridJs, { Agrid } from 'agrid-js'
import { AgridErrorBoundary } from 'agrid-js/react'
import { useEffect, useState } from 'react'

export default function LocalProvider({ debug, children }: { debug: boolean; children: React.ReactNode }) {
    const [client, setClient] = useState<Agrid | undefined>()

    useEffect(() => {
        const agrid = agridJs.init(process.env.NEXT_PUBLIC_AGRID_KEY || '', {
            api_host: process.env.NEXT_PUBLIC_AGRID_HOST,
        })
        if (debug) {
            agrid.debug()
        }
        setClient(agrid)
    }, [setClient])

    return (
        <AgridErrorBoundary
            client={client}
            fallback={<div>An error occurred while rendering the page and exception was captured</div>}
            additionalProperties={{
                hello: 'world',
            }}
        >
            {children}
        </AgridErrorBoundary>
    )
}
