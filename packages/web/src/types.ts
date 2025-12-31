import type { AgridCoreOptions } from '@agrid/core'

export type AgridOptions = {
  autocapture?: boolean
  persistence?: 'localStorage' | 'sessionStorage' | 'cookie' | 'memory'
  persistence_name?: string
  captureHistoryEvents?: boolean
} & AgridCoreOptions
