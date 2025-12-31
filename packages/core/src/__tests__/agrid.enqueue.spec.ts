import { AgridPersistedProperty } from '@/types'
import { createTestClient, AgridCoreTestClient, AgridCoreTestClientMocks } from '@/testing'

describe('Agrid Core', () => {
  let agrid: AgridCoreTestClient
  let mocks: AgridCoreTestClientMocks

  beforeEach(() => {
    jest.setSystemTime(new Date('2022-01-01'))
  })

  function createSut(maxQueueSize: number = 1000, flushAt: number = 20): void {
    ;[agrid, mocks] = createTestClient('TEST_API_KEY', {
      maxQueueSize: maxQueueSize,
      flushAt: flushAt,
    })
  }

  describe('enqueue', () => {
    it('should add a message to the queue', () => {
      createSut()

      agrid.capture('type', {
        foo: 'bar',
      })

      expect(agrid.getPersistedProperty(AgridPersistedProperty.Queue)).toHaveLength(1)

      const item = agrid.getPersistedProperty<any[]>(AgridPersistedProperty.Queue)?.pop()

      expect(item).toMatchObject({
        message: {
          library: 'agrid-core-tests',
          library_version: '2.0.0-alpha',
          type: 'capture',
          properties: {
            foo: 'bar',
          },
        },
      })

      expect(mocks.fetch).not.toHaveBeenCalled()
    })

    it('should delete oldest message if queue is full', () => {
      createSut(2, 2)

      agrid.capture('type1', {
        foo: 'bar',
      })

      agrid.capture('type2', {
        foo: 'bar',
      })

      agrid.capture('type3', {
        foo: 'bar',
      })

      expect(agrid.getPersistedProperty(AgridPersistedProperty.Queue)).toHaveLength(2)

      let item = agrid.getPersistedProperty<any[]>(AgridPersistedProperty.Queue)?.pop()

      expect(item).toMatchObject({
        message: {
          library: 'agrid-core-tests',
          library_version: '2.0.0-alpha',
          type: 'capture',
          properties: {
            foo: 'bar',
          },
          event: 'type3',
        },
      })

      item = agrid.getPersistedProperty<any[]>(AgridPersistedProperty.Queue)?.pop()

      expect(item).toMatchObject({
        message: {
          library: 'agrid-core-tests',
          library_version: '2.0.0-alpha',
          type: 'capture',
          properties: {
            foo: 'bar',
          },
          event: 'type2',
        },
      })

      expect(mocks.fetch).not.toHaveBeenCalled()
    })
  })
})
