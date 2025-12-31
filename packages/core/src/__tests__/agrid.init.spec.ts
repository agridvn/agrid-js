import { createTestClient, waitForPromises, AgridCoreTestClient, AgridCoreTestClientMocks } from '@/testing'

describe('Agrid Core', () => {
  let agrid: AgridCoreTestClient
  let mocks: AgridCoreTestClientMocks

  beforeEach(() => {
    ;[agrid, mocks] = createTestClient('TEST_API_KEY', {})
  })

  describe('init', () => {
    it('should initialise', () => {
      expect(agrid.optedOut).toEqual(false)
    })

    it('should throw if missing api key', () => {
      expect(() => createTestClient(undefined as unknown as string)).toThrowError(
        "You must pass your Agrid project's api key."
      )
    })

    it('should throw if empty api key', () => {
      expect(() => createTestClient('   ')).toThrowError("You must pass your Agrid project's api key.")
    })

    it('should throw if non string api key', () => {
      expect(() => createTestClient({} as string)).toThrowError("You must pass your Agrid project's api key.")
    })

    it('should initialise default options', () => {
      expect(agrid as any).toMatchObject({
        apiKey: 'TEST_API_KEY',
        host: 'https://app.agrid.com',
        flushAt: 20,
        flushInterval: 10000,
      })
    })

    it('overwrites defaults with options', () => {
      ;[agrid, mocks] = createTestClient('key', {
        host: 'https://a.com',
        flushAt: 1,
        flushInterval: 2,
      })

      expect(agrid).toMatchObject({
        apiKey: 'key',
        host: 'https://a.com',
        flushAt: 1,
        flushInterval: 2,
      })
    })

    it('should keep the flushAt option above zero', () => {
      ;[agrid, mocks] = createTestClient('key', { flushAt: -2 }) as any
      expect((agrid as any).flushAt).toEqual(1)
    })

    it('should remove trailing slashes from `host`', () => {
      ;[agrid, mocks] = createTestClient('TEST_API_KEY', { host: 'http://my-agrid.com///' })

      expect((agrid as any).host).toEqual('http://my-agrid.com')
    })

    it('should use bootstrapped distinct ID when present', async () => {
      ;[agrid, mocks] = createTestClient('TEST_API_KEY', { bootstrap: { distinctId: 'new_anon_id' } })

      expect((agrid as any).getDistinctId()).toEqual('new_anon_id')
      expect((agrid as any).getAnonymousId()).toEqual('new_anon_id')

      await agrid.identify('random_id')

      expect((agrid as any).getDistinctId()).toEqual('random_id')
      expect((agrid as any).getAnonymousId()).toEqual('new_anon_id')
    })

    it('should use bootstrapped distinct ID as identified ID when present', async () => {
      ;[agrid, mocks] = createTestClient('TEST_API_KEY', {
        bootstrap: { distinctId: 'new_id', isIdentifiedId: true },
      })
      jest.runOnlyPendingTimers()

      expect((agrid as any).getDistinctId()).toEqual('new_id')
      expect((agrid as any).getAnonymousId()).not.toEqual('new_id')

      await agrid.identify('random_id')

      expect((agrid as any).getDistinctId()).toEqual('random_id')
      expect((agrid as any).getAnonymousId()).toEqual('new_id')
    })
  })

  describe('disabled', () => {
    it('should not send events when disabled', async () => {
      ;[agrid, mocks] = createTestClient('TEST_API_KEY', {
        disabled: true,
        flushAt: 1,
      })
      jest.runOnlyPendingTimers()

      expect(agrid.getFeatureFlags()).toEqual(undefined)
      agrid.capture('test')
      agrid.capture('identify')

      await waitForPromises()

      expect(mocks.fetch).not.toHaveBeenCalled()
    })
  })
})
