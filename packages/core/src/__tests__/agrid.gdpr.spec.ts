import { AgridPersistedProperty } from '@/types'
import { createTestClient, AgridCoreTestClient, AgridCoreTestClientMocks } from '@/testing'

describe('Agrid Core', () => {
  let agrid: AgridCoreTestClient
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mocks: AgridCoreTestClientMocks

  jest.useFakeTimers()

  beforeEach(() => {
    ;[agrid, mocks] = createTestClient('TEST_API_KEY', { flushAt: 5 })
  })

  describe('optOut', () => {
    it('should be optedIn by default', async () => {
      expect(agrid.optedOut).toEqual(false)
    })

    it('should be able to init disabled', async () => {
      ;[agrid, mocks] = createTestClient('TEST_API_KEY', { defaultOptIn: false })
      expect(agrid.optedOut).toEqual(true)
    })

    it('should opt in/out when called', async () => {
      ;[agrid, mocks] = createTestClient('TEST_API_KEY', { defaultOptIn: false })
      agrid.optOut()
      expect(agrid.optedOut).toEqual(true)
      agrid.optIn()
      expect(agrid.optedOut).toEqual(false)
    })

    it('should persist enabled state when called', async () => {
      ;[agrid, mocks] = createTestClient('TEST_API_KEY', { defaultOptIn: false })
      expect(agrid.getPersistedProperty(AgridPersistedProperty.OptedOut)).toEqual(undefined)
      agrid.optOut()
      expect(agrid.getPersistedProperty(AgridPersistedProperty.OptedOut)).toEqual(true)
      agrid.optIn()
      expect(agrid.getPersistedProperty(AgridPersistedProperty.OptedOut)).toEqual(false)
    })

    it('should start in the correct state', async () => {
      ;[agrid, mocks] = createTestClient('TEST_API_KEY', { defaultOptIn: false }, (mocks) => {
        mocks.storage.setItem(AgridPersistedProperty.OptedOut, true)
      })

      expect(agrid.optedOut).toEqual(true)
    })
  })
})
