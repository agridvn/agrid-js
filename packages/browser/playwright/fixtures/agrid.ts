import { TestInfo } from '@playwright/test'
import { CaptureResult, AgridConfig } from '@/types'
import { Agrid } from '@/agrid-core'
import { EventsPage, testEvents } from './events'
import { BasePage } from './page'

export const testAgrid = testEvents.extend<{
    agrid: AgridPage
    agridOptions: Partial<AgridConfig>
}>({
    agridOptions: [{ request_batching: false }, { option: true }],
    agrid: async ({ page, events, agridOptions }, use, testInfo) => {
        const agridPage = new AgridPage(agridOptions, page, events, testInfo)
        await use(agridPage)
    },
})

const currentEnv = process.env
const {
    AGRID_PROJECT_KEY = 'public_key',
    AGRID_API_HOST = 'http://localhost:2345',
    BRANCH_NAME,
    RUN_ID,
    BROWSER,
} = currentEnv

export type WindowWithAgrid = typeof globalThis & {
    agrid?: Agrid
    capturedEvents?: CaptureResult[]
    [key: string]: any
}

export class AgridPage {
    testSessionId: string

    constructor(
        private baseOptions: Partial<AgridConfig>,
        private page: BasePage,
        private events: EventsPage,
        private testInfos: TestInfo
    ) {
        this.testSessionId = Math.random().toString(36).substring(2, 15)
    }

    getTestSessionId() {
        return this.testSessionId
    }

    getTestTitle() {
        return this.testInfos.title
    }

    private getHandle() {
        return this.page.evaluateHandle(() => {
            const instance = (window as WindowWithAgrid).agrid
            if (!instance) {
                throw new Error('Agrid instance not found')
            }
            return instance
        })
    }

    async evaluate<T, U>(fn: (agrid: Agrid, args: T) => U, args?: T): Promise<U> {
        const handle = await this.getHandle()
        return await handle.evaluate(fn as any, args)
    }

    async waitForLoaded() {
        await this.page.waitForFunction(() => {
            return (window as WindowWithAgrid).agrid?.__loaded ?? false
        })
    }

    async init(
        initOptions: Partial<Omit<AgridConfig, 'before_send' | 'loaded'>> = {},
        beforeSendHandles: string[] = []
    ) {
        const additionalProperties = {
            testSessionId: this.getTestSessionId(),
            testName: this.testInfos.title,
            testBranchName: BRANCH_NAME,
            testRunId: RUN_ID,
            testBrowser: BROWSER,
        }
        const storeHandle = await this.page.createFunctionHandle((evt: CaptureResult) => {
            this.events.addEvent(evt)
        })
        await this.page.evaluate((storeHandle) => {
            ;(window as WindowWithAgrid)['last_before_send'] = (evt: CaptureResult) => {
                ;(window as WindowWithAgrid)[storeHandle](evt)
                return evt
            }
        }, storeHandle)
        await this.evaluate(
            // TS very unhappy with passing AgridConfig here, so just pass an object
            (ag: Agrid, args: Record<string, any>) => {
                const agridConfig: Partial<AgridConfig> = {
                    api_host: args.apiHost,
                    debug: true,
                    ip: false, // Prevent IP deprecation warning in Playwright tests
                    ...args.options,
                    before_send: args.beforeSendHandles.map((h: any) => window[h]),
                    loaded: (ag) => {
                        if (ag.sessionRecording) {
                            ag.sessionRecording._forceAllowLocalhostNetworkCapture = true
                        }
                        ag.register(args.additionalProperties)
                        // playwright can't serialize functions to pass around from the playwright to browser context
                        // if we want to run custom code in the loaded function we need to pass it on the page's window,
                        // but it's a new window so we have to create it in the `before_agrid_init` option
                        ;(window as any).__ag_loaded?.(ag)
                    },
                    opt_out_useragent_filter: true,
                }
                ag.init(args.token, agridConfig)
            },
            {
                token: AGRID_PROJECT_KEY,
                apiHost: AGRID_API_HOST,
                options: {
                    ...this.baseOptions,
                    ...initOptions,
                },
                beforeSendHandles: [...beforeSendHandles, 'last_before_send'],
                additionalProperties,
            } as Record<string, any>
        )
        await this.page.waitForLoadState('networkidle')
    }

    async capture(eventName: string, properties?: Record<string, any>) {
        await this.evaluate(
            (ag, args: { eventName: string; properties?: Record<string, any> }) => {
                ag.capture(args.eventName, args.properties)
            },
            { eventName, properties }
        )
    }

    async register(records: Record<string, string>) {
        await this.page.evaluate(
            // TS very unhappy with passing AgridConfig here, so just pass an object
            (args: Record<string, any>) => {
                const windowAgrid = (window as WindowWithAgrid).agrid
                windowAgrid?.register(args)
            },
            records
        )
    }
}
