import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app.tsx'
import { agrid } from 'agrid-js'

agrid.init(import.meta.env.VITE_AGRID_KEY || '', {
    api_host: import.meta.env.VITE_AGRID_HOST || 'http://localhost:8010',
    autocapture: true,
})

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>
)
