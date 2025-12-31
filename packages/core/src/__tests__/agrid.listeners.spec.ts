import { waitForPromises, createTestClient, AgridCoreTestClient, AgridCoreTestClientMocks } from '@/testing'

describe('Agrid Core', () => {
  let agrid: AgridCoreTestClient
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mocks: AgridCoreTestClientMocks

  jest.useFakeTimers()
  jest.setSystemTime(new Date('2022-01-01'))

  beforeEach(() => {
    ;[agrid, mocks] = createTestClient('TEST_API_KEY', { flushAt: 10 })
  })

  describe('on', () => {
    it('should listen to various events', () => {
      const mock = jest.fn()
      const mockOther = jest.fn()
      agrid.on('identify', mock)
      agrid.on('identify', mockOther)

      agrid.identify('user-1')
      expect(mock).toHaveBeenCalledTimes(1)
      expect(mockOther).toHaveBeenCalledTimes(1)
      expect(mock.mock.lastCall[0]).toMatchObject({ type: 'identify' })
    })

    it('should unsubscribe when called', () => {
      const mock = jest.fn()
      const unsubscribe = agrid.on('identify', mock)

      agrid.identify('user-1')
      expect(mock).toHaveBeenCalledTimes(1)
      agrid.identify('user-1')
      expect(mock).toHaveBeenCalledTimes(2)
      unsubscribe()
      agrid.identify('user-1')
      expect(mock).toHaveBeenCalledTimes(2)
    })

    it('should subscribe to flush events', async () => {
      const mock = jest.fn()
      agrid.on('flush', mock)
      agrid.capture('event')
      expect(mock).toHaveBeenCalledTimes(0)
      jest.runOnlyPendingTimers()
      await waitForPromises()
      expect(mock).toHaveBeenCalledTimes(1)
    })
  })
})
