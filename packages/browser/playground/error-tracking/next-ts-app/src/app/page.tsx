'use client'

import Link from 'next/link'
import agrid from 'agrid-js'

export default function Home() {
    return (
        <div>
            <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Link href="./error?messsage=Rendering%20Error">
                    <button>Generate rendering error</button>
                </Link>
                <button onClick={() => agrid.captureException(new Error('Programming error'))}>Send error</button>
            </main>
        </div>
    )
}
