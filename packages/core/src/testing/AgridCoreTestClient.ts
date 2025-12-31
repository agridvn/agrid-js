import { AgridCore } from '@/agrid-core'
import type { JsonType, AgridCoreOptions, AgridFetchOptions, AgridFetchResponse, AgridFlagsResponse } from '@/types'

const version = '2.0.0-alpha'

export interface AgridCoreTestClientMocks {
  fetch: jest.Mock<Promise<AgridFetchResponse>, [string, AgridFetchOptions]>
  storage: {
    getItem: jest.Mock<any | undefined, [string]>
    setItem: jest.Mock<void, [string, any | null]>
  }
}

export class AgridCoreTestClient extends AgridCore {
  public _cachedDistinctId?: string

  constructor(
    private mocks: AgridCoreTestClientMocks,
    apiKey: string,
    options?: AgridCoreOptions
  ) {
    super(apiKey, options)

    this.setupBootstrap(options)
  }

  // Expose protected methods for testing
  public getFlags(
    distinctId: string,
    groups: Record<string, string | number> = {},
    personProperties: Record<string, string> = {},
    groupProperties: Record<string, Record<string, string>> = {},
    extraPayload: Record<string, any> = {}
  ): Promise<AgridFlagsResponse | undefined> {
    return super.getFlags(distinctId, groups, personProperties, groupProperties, extraPayload)
  }

  getPersistedProperty<T>(key: string): T {
    return this.mocks.storage.getItem(key)
  }
  setPersistedProperty<T>(key: string, value: T | null): void {
    return this.mocks.storage.setItem(key, value)
  }
  fetch(url: string, options: AgridFetchOptions): Promise<AgridFetchResponse> {
    return this.mocks.fetch(url, options)
  }
  getLibraryId(): string {
    return 'agrid-core-tests'
  }
  getLibraryVersion(): string {
    return version
  }
  getCustomUserAgent(): string {
    return 'agrid-core-tests'
  }
}

export const createTestClient = (
  apiKey: string,
  options?: AgridCoreOptions,
  setupMocks?: (mocks: AgridCoreTestClientMocks) => void,
  storageCache: { [key: string]: string | JsonType } = {}
): [AgridCoreTestClient, AgridCoreTestClientMocks] => {
  const mocks = {
    fetch: jest.fn(),
    storage: {
      getItem: jest.fn((key) => storageCache[key]),
      setItem: jest.fn((key, val) => {
        storageCache[key] = val == null ? undefined : val
      }),
    },
  }

  mocks.fetch.mockImplementation(() =>
    Promise.resolve({
      status: 200,
      text: () => Promise.resolve('ok'),
      json: () => Promise.resolve({ status: 'ok' }),
    })
  )

  setupMocks?.(mocks)

  return [new AgridCoreTestClient(mocks, apiKey, { disableCompression: true, ...options }), mocks]
}
