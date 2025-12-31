import { AgridPersistedProperty } from '@/types'
import { createTestClient, AgridCoreTestClient, AgridCoreTestClientMocks } from '@/testing'

describe('Agrid Core', () => {
  let agrid: AgridCoreTestClient
  let mocks: AgridCoreTestClientMocks

  jest.useFakeTimers()
  jest.setSystemTime(new Date('2022-01-01T12:00:00'))

  beforeEach(() => {
    ;[agrid, mocks] = createTestClient('TEST_API_KEY', { flushAt: 1 })
  })

  describe('sessions', () => {
    it('should create a sessionId if not set', () => {
      expect(agrid.getPersistedProperty(AgridPersistedProperty.SessionId)).toEqual(undefined)
      agrid.capture('test')
      expect(mocks.storage.setItem).toHaveBeenCalledWith(AgridPersistedProperty.SessionId, expect.any(String))
      expect(agrid.getPersistedProperty(AgridPersistedProperty.SessionId)).toEqual(expect.any(String))
      expect(agrid.getPersistedProperty(AgridPersistedProperty.SessionLastTimestamp)).toEqual(Date.now())
    })

    it('should re-use existing sessionId', () => {
      agrid.setPersistedProperty(AgridPersistedProperty.SessionId, 'test-session-id')
      const now = Date.now()
      agrid.setPersistedProperty(AgridPersistedProperty.SessionLastTimestamp, now)
      agrid.setPersistedProperty(AgridPersistedProperty.SessionStartTimestamp, now)
      agrid.capture('test')
      expect(agrid.getPersistedProperty(AgridPersistedProperty.SessionId)).toEqual('test-session-id')
    })

    it('should generate new sessionId if expired', () => {
      jest.setSystemTime(new Date('2022-01-01T12:00:00'))
      agrid.capture('test')
      const sessionId = agrid.getPersistedProperty(AgridPersistedProperty.SessionId)

      // Check 29 minutes later
      jest.setSystemTime(new Date('2022-01-01T12:29:00'))
      agrid.capture('test')
      expect(agrid.getPersistedProperty(AgridPersistedProperty.SessionId)).toEqual(sessionId)

      // Check another 29 minutes later
      jest.setSystemTime(new Date('2022-01-01T12:58:00'))
      agrid.capture('test')
      expect(agrid.getPersistedProperty(AgridPersistedProperty.SessionId)).toEqual(sessionId)

      // Check more than 30 minutes later
      jest.setSystemTime(new Date('2022-01-01T13:30:00'))
      agrid.capture('test')
      expect(agrid.getPersistedProperty(AgridPersistedProperty.SessionId)).not.toEqual(sessionId)
    })

    it('should reset sessionId if called', () => {
      agrid.capture('test')
      const sessionId = agrid.getPersistedProperty(AgridPersistedProperty.SessionId)

      agrid.resetSessionId()
      agrid.capture('test2')
      expect(agrid.getPersistedProperty(AgridPersistedProperty.SessionId)).not.toEqual(sessionId)
    })
  })
})
