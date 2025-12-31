import type { Metadata } from 'next'
import { AgridWrapper } from './providers'
import './globals.css'

export const metadata: Metadata = {
    title: 'Agrid InView Playground',
    description: 'Test Agrid InView component with a cat gallery',
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
            <body>
                <AgridWrapper>{children}</AgridWrapper>
            </body>
        </html>
    )
}
