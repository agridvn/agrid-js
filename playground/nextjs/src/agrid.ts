// NOTE: This is how you can include the external dependencies so they are in your bundle and not loaded async at runtime
// import 'agrid-js/dist/recorder'
// import 'agrid-js/dist/surveys'
// import 'agrid-js/dist/exception-autocapture'
// import 'agrid-js/dist/tracing-headers'

import agridJS, { Agrid, AgridConfig } from 'agrid-js'
import { User } from './auth'

export const PERSON_PROCESSING_MODE: 'always' | 'identified_only' | 'never' =
    (process.env.NEXT_PUBLIC_AGRID_PERSON_PROCESSING_MODE as any) || 'identified_only'

export const AGRID_USE_SNIPPET: boolean = (process.env.NEXT_PUBLIC_AGRID_USE_SNIPPET as any) || false

export const agrid: Agrid = AGRID_USE_SNIPPET
    ? typeof window !== 'undefined'
        ? (window as any).agrid
        : null
    : agridJS

// we use undefined for SSR to indicated that we haven't check yet (as the state lives in cookies)
export type ConsentState = 'granted' | 'denied' | 'pending' | undefined

/**
 * Below is an example of a consent-driven config for Agrid
 * Lots of things start in a disabled state and agrid will not use cookies without consent
 *
 * Once given, we enable autocapture, session recording, and use localStorage+cookie for persistence via set_config
 * This is only an example - data privacy requirements are different for every project
 */
export function cookieConsentGiven(): ConsentState {
    if (typeof window === 'undefined') return undefined
    return agrid.get_explicit_consent_status()
}

export const configForConsent = (): Partial<AgridConfig> => {
    const consentGiven = cookieConsentGiven()

    return {
        disable_surveys: consentGiven !== 'granted',
        autocapture: consentGiven === 'granted',
        disable_session_recording: consentGiven !== 'granted',
    }
}

export const updateAgridConsent = (consentGiven: ConsentState) => {
    if (consentGiven !== undefined) {
        if (consentGiven === 'granted') {
            agrid.opt_in_capturing()
        } else if (consentGiven === 'denied') {
            agrid.opt_out_capturing()
        } else if (consentGiven === 'pending') {
            agrid.clear_opt_in_out_capturing()
            agrid.reset()
        }
    }

    agrid.set_config(configForConsent())
}

if (typeof window !== 'undefined') {
    agrid.init(process.env.NEXT_PUBLIC_AGRID_KEY || 'test-token', {
        api_host: process.env.NEXT_PUBLIC_AGRID_HOST || 'https://app.agrid.vn',
        session_recording: {
            recordCrossOriginIframes: true,
            blockSelector: '.ag-block-image',
            ignoreClass: 'ag-ignore-image',
        },
        debug: true,
        capture_pageview: 'history_change',
        disable_web_experiments: false,
        scroll_root_selector: ['#scroll_element', 'html'],
        persistence: 'localStorage+cookie',
        person_profiles: PERSON_PROCESSING_MODE === 'never' ? 'identified_only' : PERSON_PROCESSING_MODE,
        persistence_name: `${process.env.NEXT_PUBLIC_AGRID_KEY || 'test'}_nextjs`,
        opt_in_site_apps: true,
        integrations: {
            intercom: true,
            crispChat: true,
        },
        __preview_remote_config: true,
        cookieless_mode: 'on_reject',
        __preview_flags_v2: true,
        __preview_deferred_init_extensions: true,
        ...configForConsent(),
    })
    // Help with debugging
    ;(window as any).agrid = agrid
}

export const agridHelpers = {
    onLogin: (user: User) => {
        if (PERSON_PROCESSING_MODE === 'never') {
            // We just set the user properties instead of identifying them
            agridHelpers.setUser(user)
        } else {
            agrid.identify(user.email, user)
        }

        agrid.capture('Logged in')
    },
    onLogout: () => {
        agrid.capture('Logged out')
        agrid.reset()
    },
    setUser: (user: User) => {
        if (PERSON_PROCESSING_MODE === 'never') {
            const eventProperties = {
                person_id: user.email,
                person_email: user.email,
                person_name: user.name,
                team_id: user.team?.id,
                team_name: user.team?.name,
            }
            agrid.register(eventProperties)
            agrid.setPersonPropertiesForFlags(user)
        } else {
            // NOTE: Would this always get set?
            if (user.team) {
                agrid.group('team', user.team.id, user.team)
            }
        }
    },
}
