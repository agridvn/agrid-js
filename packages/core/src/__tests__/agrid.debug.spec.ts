import { createTestClient, AgridCoreTestClient } from '@/testing'

describe('Agrid Core', () => {
  let agrid: AgridCoreTestClient
  let logSpy: jest.SpyInstance

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    ;[agrid] = createTestClient('TEST_API_KEY', {})
  })

  describe('debug', () => {
    it('should log emitted events when enabled', () => {
      agrid.capture('test-event1')
      expect(logSpy).toHaveBeenCalledTimes(0)

      agrid.debug()
      agrid.capture('test-event1')
      expect(logSpy).toHaveBeenCalledTimes(1)
      expect(logSpy).toHaveBeenCalledWith(
        '[Agrid]',
        'capture',
        expect.objectContaining({
          event: 'test-event1',
        })
      )

      logSpy.mockReset()
      agrid.debug(false)
      agrid.capture('test-event1')
      expect(logSpy).toHaveBeenCalledTimes(0)
    })
  })
})
