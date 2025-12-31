import { delay, waitForPromises, createTestClient, AgridCoreTestClient, AgridCoreTestClientMocks } from '@/testing'
import { AgridPersistedProperty } from '@/types'

describe('Agrid Core', () => {
  let agrid: AgridCoreTestClient
  let mocks: AgridCoreTestClientMocks

  describe('flush', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      ;[agrid, mocks] = createTestClient('TEST_API_KEY', {
        flushAt: 5,
        fetchRetryCount: 3,
        fetchRetryDelay: 100,
        preloadFeatureFlags: false,
      })
    })

    it("doesn't fail when queue is empty", async () => {
      jest.useRealTimers()
      await expect(agrid.flush()).resolves.not.toThrow()
      expect(mocks.fetch).not.toHaveBeenCalled()
    })

    it('flush messages once called', async () => {
      const successfulMessages: any[] = []

      mocks.fetch.mockImplementation(async (_, options) => {
        const batch = JSON.parse((options.body || '') as string).batch

        successfulMessages.push(...batch)
        return Promise.resolve({
          status: 200,
          text: () => Promise.resolve('ok'),
          json: () => Promise.resolve({ status: 'ok' }),
        })
      })

      agrid.capture('test-event-1')
      agrid.capture('test-event-2')
      agrid.capture('test-event-3')
      expect(mocks.fetch).not.toHaveBeenCalled()
      await expect(agrid.flush()).resolves.not.toThrow()
      expect(mocks.fetch).toHaveBeenCalled()
      expect(successfulMessages).toMatchObject([
        { event: 'test-event-1' },
        { event: 'test-event-2' },
        { event: 'test-event-3' },
      ])
    })

    it.each([400, 500])('responds with an error after retries with %s error', async (status) => {
      mocks.fetch.mockImplementation(() => {
        return Promise.resolve({
          status: status,
          text: async () => 'err',
          json: async () => ({ status: 'err' }),
        })
      })
      agrid.capture('test-event-1')

      const time = Date.now()
      jest.useRealTimers()
      await expect(agrid.flush()).rejects.toHaveProperty('name', 'AgridFetchHttpError')
      expect(mocks.fetch).toHaveBeenCalledTimes(4)
      expect(Date.now() - time).toBeGreaterThan(300)
      expect(Date.now() - time).toBeLessThan(2000)
    })

    it('responds with an error after retries with network error ', async () => {
      mocks.fetch.mockImplementation(() => {
        return Promise.reject(new Error('network problems'))
      })
      agrid.capture('test-event-1')

      const time = Date.now()
      jest.useRealTimers()
      await expect(agrid.flush()).rejects.toHaveProperty('name', 'AgridFetchNetworkError')
      expect(mocks.fetch).toHaveBeenCalledTimes(4)
      expect(Date.now() - time).toBeGreaterThan(300)
      expect(Date.now() - time).toBeLessThan(2000)
    })

    it('skips when client is disabled', async () => {
      ;[agrid, mocks] = createTestClient('TEST_API_KEY', { flushAt: 2 })

      agrid.capture('test-event-1')
      await waitForPromises()
      expect(mocks.fetch).toHaveBeenCalledTimes(0)
      agrid.capture('test-event-2')
      await waitForPromises()
      expect(mocks.fetch).toHaveBeenCalledTimes(1)
      agrid.optOut()
      agrid.capture('test-event-3')
      agrid.capture('test-event-4')
      await waitForPromises()
      expect(mocks.fetch).toHaveBeenCalledTimes(1)
    })

    it('does not get stuck in a loop when new events are added while flushing', async () => {
      jest.useRealTimers()
      mocks.fetch.mockImplementation(async () => {
        agrid.capture('another-event')
        await delay(10)
        return Promise.resolve({
          status: 200,
          text: () => Promise.resolve('ok'),
          json: () => Promise.resolve({ status: 'ok' }),
        })
      })

      agrid.capture('test-event-1')
      await agrid.flush()
      expect(mocks.fetch).toHaveBeenCalledTimes(1)
    })

    it('should flush all events even if larger than batch size', async () => {
      ;[agrid, mocks] = createTestClient('TEST_API_KEY', { flushAt: 10 })

      const successfulMessages: any[] = []

      mocks.fetch.mockImplementation(async (_, options) => {
        const batch = JSON.parse((options.body || '') as string).batch

        successfulMessages.push(...batch)
        return Promise.resolve({
          status: 200,
          text: () => Promise.resolve('ok'),
          json: () => Promise.resolve({ status: 'ok' }),
        })
      })

      agrid['maxBatchSize'] = 2
      agrid.capture('test-event-1')
      agrid.capture('test-event-2')
      agrid.capture('test-event-3')
      agrid.capture('test-event-4')
      await expect(agrid.flush()).resolves.not.toThrow()
      expect(mocks.fetch).toHaveBeenCalledTimes(2)
      expect(successfulMessages).toMatchObject([
        { event: 'test-event-1' },
        { event: 'test-event-2' },
        { event: 'test-event-3' },
        { event: 'test-event-4' },
      ])
    })

    it('should reduce the batch size without dropping events if received 413', async () => {
      ;[agrid, mocks] = createTestClient('TEST_API_KEY', { flushAt: 10 })
      const successfulMessages: any[] = []

      mocks.fetch.mockImplementation(async (_, options) => {
        const batch = JSON.parse((options.body || '') as string).batch

        if (batch.length > 1) {
          return Promise.resolve({
            status: 413,
            text: () => Promise.resolve('Content Too Large'),
            json: () => Promise.resolve({ status: 'Content Too Large' }),
          })
        } else {
          successfulMessages.push(...batch)
          return Promise.resolve({
            status: 200,
            text: () => Promise.resolve('ok'),
            json: () => Promise.resolve({ status: 'ok' }),
          })
        }
      })

      agrid.capture('test-event-1')
      agrid.capture('test-event-2')
      agrid.capture('test-event-3')
      agrid.capture('test-event-4')
      await expect(agrid.flush()).resolves.not.toThrow()
      expect(successfulMessages).toMatchObject([
        { event: 'test-event-1' },
        { event: 'test-event-2' },
        { event: 'test-event-3' },
        { event: 'test-event-4' },
      ])
      expect(mocks.fetch).toHaveBeenCalledTimes(6)
    })

    it('should treat a 413 at batchSize 1 as a regular error', async () => {
      ;[agrid, mocks] = createTestClient('TEST_API_KEY', { flushAt: 10 })

      mocks.fetch.mockImplementation(async () => {
        return Promise.resolve({
          status: 413,
          text: () => Promise.resolve('Content Too Large'),
          json: () => Promise.resolve({ status: 'Content Too Large' }),
        })
      })

      agrid.capture('test-event-1')
      await expect(agrid.flush()).rejects.toHaveProperty('name', 'AgridFetchHttpError')
      expect(mocks.fetch).toHaveBeenCalledTimes(1)
    })

    it('should stop at first error', async () => {
      jest.useRealTimers()
      ;[agrid, mocks] = createTestClient('TEST_API_KEY', { flushAt: 10, fetchRetryDelay: 1 })
      agrid['maxBatchSize'] = 1
      const successfulMessages: any[] = []

      mocks.fetch.mockImplementation(async (_, options) => {
        const batch = JSON.parse((options.body || '') as string).batch

        if (batch.some((msg: any) => msg.event.includes('cursed'))) {
          return Promise.resolve({
            status: 500,
            text: () => Promise.resolve('Cursed'),
            json: () => Promise.resolve({ status: 'Cursed' }),
          })
        } else {
          successfulMessages.push(...batch)
          return Promise.resolve({
            status: 200,
            text: () => Promise.resolve('ok'),
            json: () => Promise.resolve({ status: 'ok' }),
          })
        }
      })

      agrid.capture('test-event-1')
      agrid.capture('cursed-event-2')
      agrid.capture('test-event-3')

      await expect(agrid.flush()).rejects.toHaveProperty('name', 'AgridFetchHttpError')
      expect(successfulMessages).toMatchObject([{ event: 'test-event-1' }])
      expect(mocks.storage.getItem(AgridPersistedProperty.Queue)).toMatchObject([
        { message: { event: 'test-event-3' } },
      ])
    })
  })
})
