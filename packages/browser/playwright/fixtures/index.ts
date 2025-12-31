import { FlagsResponse, AgridConfig } from '@/types'
import { testIngestion } from './ingestion'
export const test = testIngestion
export { expect } from '@playwright/test'
export type { WindowWithAgrid } from './agrid'

export { NetworkPage } from './network'
export { AgridPage } from './agrid'
export { EventsPage } from './events'
export { IngestionPage } from './ingestion'

export type StartOptions = {
    agridOptions?: Partial<AgridConfig>
    flagsOverrides?: Partial<FlagsResponse>
    staticOverrides?: Record<string, string>
    url?: string
}
