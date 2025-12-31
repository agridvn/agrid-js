import { version } from './version'

import { AgridCore, getFetch } from '@agrid/core'
import type { AgridEventProperties, AgridFetchOptions, AgridFetchResponse, AgridPersistedProperty } from '@agrid/core'

import { getContext } from './context'
import { AgridStorage, getStorage } from './storage'
import { AgridOptions } from './types'
import { patch } from './patch'

export class AgridWeb extends AgridCore {
  private _storage: AgridStorage
  private _storageCache: any
  private _storageKey: string
  private _lastPathname: string = ''

  constructor(apiKey: string, options?: AgridOptions) {
    super(apiKey, options)

    this._storageKey = options?.persistence_name ? `ag_${options.persistence_name}` : `ag_${apiKey}_agrid`

    this._storage = getStorage(options?.persistence || 'localStorage', this.getWindow())
    this.setupBootstrap(options)

    if (options?.preloadFeatureFlags !== false) {
      this.reloadFeatureFlags()
    }

    if (options?.captureHistoryEvents && typeof window !== 'undefined') {
      this._lastPathname = window?.location?.pathname || ''
      this.setupHistoryEventTracking()
    }
  }

  private getWindow(): Window | undefined {
    return typeof window !== 'undefined' ? window : undefined
  }

  getPersistedProperty<T>(key: AgridPersistedProperty): T | undefined {
    if (!this._storageCache) {
      this._storageCache = JSON.parse(this._storage.getItem(this._storageKey) || '{}') || {}
    }

    return this._storageCache[key]
  }

  setPersistedProperty<T>(key: AgridPersistedProperty, value: T | null): void {
    if (!this._storageCache) {
      this._storageCache = JSON.parse(this._storage.getItem(this._storageKey) || '{}') || {}
    }

    if (value === null) {
      delete this._storageCache[key]
    } else {
      this._storageCache[key] = value
    }

    this._storage.setItem(this._storageKey, JSON.stringify(this._storageCache))
  }

  fetch(url: string, options: AgridFetchOptions): Promise<AgridFetchResponse> {
    const fetchFn = getFetch()

    if (!fetchFn) {
      return Promise.reject(new Error('Fetch API is not available in this environment.'))
    }

    return fetchFn(url, options)
  }

  getLibraryId(): string {
    return 'agrid-js-lite'
  }

  getLibraryVersion(): string {
    return version
  }

  getCustomUserAgent(): void {
    return
  }

  getCommonEventProperties(): AgridEventProperties {
    return {
      ...super.getCommonEventProperties(),
      ...getContext(this.getWindow()),
    }
  }

  private setupHistoryEventTracking(): void {
    const window = this.getWindow()
    if (!window) {
      return
    }

    const self = this

    patch(window.history, 'pushState', (originalPushState) => {
      return function patchedPushState(this: History, state: any, title: string, url?: string | URL | null): void {
        ;(originalPushState as History['pushState']).call(this, state, title, url)
        self.captureNavigationEvent('pushState')
      }
    })

    patch(window.history, 'replaceState', (originalReplaceState) => {
      return function patchedReplaceState(this: History, state: any, title: string, url?: string | URL | null): void {
        ;(originalReplaceState as History['replaceState']).call(this, state, title, url)
        self.captureNavigationEvent('replaceState')
      }
    })

    window.addEventListener('popstate', () => {
      this.captureNavigationEvent('popstate')
    })
  }

  private captureNavigationEvent(navigationType: 'pushState' | 'replaceState' | 'popstate'): void {
    const window = this.getWindow()
    if (!window) {
      return
    }

    const currentPathname = window.location.pathname

    if (currentPathname !== this._lastPathname) {
      this.capture('$pageview', { navigation_type: navigationType })
      this._lastPathname = currentPathname
    }
  }
}
