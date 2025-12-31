import { parseBody, waitForPromises, createTestClient, AgridCoreTestClient, AgridCoreTestClientMocks } from '@/testing'
import { AgridPersistedProperty } from '@/types'

describe('Agrid Core', () => {
  let agrid: AgridCoreTestClient
  let mocks: AgridCoreTestClientMocks

  jest.useFakeTimers()
  jest.setSystemTime(new Date('2022-01-01'))

  beforeEach(() => {
    ;[agrid, mocks] = createTestClient('TEST_API_KEY', { flushAt: 1 })
  })

  describe('identify', () => {
    it('should send an $identify event', async () => {
      agrid.identify('id-1', { foo: 'bar' })
      await waitForPromises()
      expect(mocks.fetch).toHaveBeenCalledTimes(2)
      const batchCall = mocks.fetch.mock.calls[1]
      expect(batchCall[0]).toEqual('https://app.agrid.com/batch/')
      expect(parseBody(batchCall)).toMatchObject({
        api_key: 'TEST_API_KEY',
        batch: [
          {
            event: '$identify',
            distinct_id: agrid.getDistinctId(),
            library: 'agrid-core-tests',
            library_version: '2.0.0-alpha',
            properties: {
              $lib: 'agrid-core-tests',
              $lib_version: '2.0.0-alpha',
              $anon_distinct_id: expect.any(String),
              $session_id: expect.any(String),
              $set: {
                foo: 'bar',
              },
            },
            timestamp: expect.any(String),
            uuid: expect.any(String),
            type: 'identify',
          },
        ],
        sent_at: expect.any(String),
      })
    })

    it('should send an $identify with $set and $set_once event', async () => {
      agrid.identify('id-1', {
        $set: {
          foo: 'bar',
        },
        $set_once: {
          vip: true,
        },
      })
      await waitForPromises()
      expect(mocks.fetch).toHaveBeenCalledTimes(2)
      const batchCall = mocks.fetch.mock.calls[1]
      expect(batchCall[0]).toEqual('https://app.agrid.com/batch/')
      expect(parseBody(batchCall)).toMatchObject({
        api_key: 'TEST_API_KEY',
        batch: [
          {
            event: '$identify',
            distinct_id: agrid.getDistinctId(),
            library: 'agrid-core-tests',
            library_version: '2.0.0-alpha',
            properties: {
              $lib: 'agrid-core-tests',
              $lib_version: '2.0.0-alpha',
              $anon_distinct_id: expect.any(String),
              $session_id: expect.any(String),
              $set: {
                foo: 'bar',
              },
              $set_once: {
                vip: true,
              },
            },
            timestamp: expect.any(String),
            uuid: expect.any(String),
            type: 'identify',
          },
        ],
        sent_at: expect.any(String),
      })
    })

    it('should send an $identify with $set_once event', async () => {
      agrid.identify('id-1', {
        foo: 'bar',
        $set_once: {
          vip: true,
        },
      })
      await waitForPromises()
      expect(mocks.fetch).toHaveBeenCalledTimes(2)
      const batchCall = mocks.fetch.mock.calls[1]
      expect(batchCall[0]).toEqual('https://app.agrid.com/batch/')
      expect(parseBody(batchCall)).toMatchObject({
        api_key: 'TEST_API_KEY',
        batch: [
          {
            event: '$identify',
            distinct_id: agrid.getDistinctId(),
            library: 'agrid-core-tests',
            library_version: '2.0.0-alpha',
            properties: {
              $lib: 'agrid-core-tests',
              $lib_version: '2.0.0-alpha',
              $anon_distinct_id: expect.any(String),
              $session_id: expect.any(String),
              $set: {
                foo: 'bar',
              },
              $set_once: {
                vip: true,
              },
            },
            timestamp: expect.any(String),
            uuid: expect.any(String),
            type: 'identify',
          },
        ],
        sent_at: expect.any(String),
      })
    })

    it('should include anonymous ID if set', async () => {
      agrid.identify('id-1', { foo: 'bar' })
      await waitForPromises()

      expect(mocks.fetch).toHaveBeenCalledTimes(2)
      const batchCall = mocks.fetch.mock.calls[1]
      expect(batchCall[0]).toEqual('https://app.agrid.com/batch/')
      expect(parseBody(batchCall)).toMatchObject({
        batch: [
          {
            distinct_id: agrid.getDistinctId(),
            properties: {
              $anon_distinct_id: expect.any(String),
            },
          },
        ],
      })
    })

    it('should update distinctId if different', () => {
      const distinctId = agrid.getDistinctId()
      agrid.identify('id-1', { foo: 'bar' })

      expect(mocks.storage.setItem).toHaveBeenCalledWith('anonymous_id', distinctId)
      expect(mocks.storage.setItem).toHaveBeenCalledWith('distinct_id', 'id-1')
    })

    it('should use existing distinctId from storage', async () => {
      mocks.storage.setItem(AgridPersistedProperty.AnonymousId, 'my-old-value')
      mocks.storage.setItem.mockClear()
      agrid.identify('id-1', { foo: 'bar' })
      await waitForPromises()

      expect(mocks.storage.setItem).toHaveBeenCalledWith('distinct_id', 'id-1')
      expect(mocks.fetch).toHaveBeenCalledTimes(2)
      const batchCall = mocks.fetch.mock.calls[1]
      expect(batchCall[0]).toEqual('https://app.agrid.com/batch/')
      expect(parseBody(batchCall)).toMatchObject({
        batch: [
          {
            distinct_id: 'id-1',
            properties: {
              $anon_distinct_id: 'my-old-value',
            },
          },
        ],
      })
    })

    it('should not update stored properties if distinct_id the same', () => {
      mocks.storage.setItem(AgridPersistedProperty.DistinctId, 'id-1')
      mocks.storage.setItem.mockClear()
      agrid.identify('id-1', { foo: 'bar' })
      expect(mocks.storage.setItem).not.toHaveBeenCalledWith('distinct_id', 'id-1')
    })
  })
})
