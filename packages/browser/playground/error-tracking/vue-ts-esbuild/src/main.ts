import { createApp } from 'vue'
import App from './App.vue'
import { agrid } from 'agrid-js'

agrid.init(import.meta.env.VITE_AGRID_KEY, {
    api_host: import.meta.env.VITE_AGRID_HOST || 'http://localhost:8010/',
})

createApp(App).mount('#app')
