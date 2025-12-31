// src/agrid.js
import agrid from 'agrid-js'

agrid.init(process.env.AGRID_TOKEN, {
    api_host: process.env.AGRID_API_HOST,
    ui_host: process.env.AGRID_UI_HOST,
    person_profiles: 'identified_only',
})

window.agrid = agrid
