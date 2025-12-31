import { AgridPersistedProperty } from '@/types'
import { createTestClient, AgridCoreTestClient, AgridCoreTestClientMocks } from '@/testing'

describe('Agrid Core', () => {
  let agrid: AgridCoreTestClient
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mocks: AgridCoreTestClientMocks

  const getEnrichedProperties = (): any => {
    return (agrid as any).enrichProperties()
  }

  beforeEach(() => {
    ;[agrid, mocks] = createTestClient('TEST_API_KEY', {})
  })

  describe('register', () => {
    it('should register properties to storage', () => {
      agrid.register({ foo: 'bar' })
      expect(getEnrichedProperties()).toMatchObject({ foo: 'bar' })
      expect(agrid.getPersistedProperty(AgridPersistedProperty.Props)).toEqual({ foo: 'bar' })
      agrid.register({ foo2: 'bar2' })
      expect(getEnrichedProperties()).toMatchObject({ foo: 'bar', foo2: 'bar2' })
      expect(agrid.getPersistedProperty(AgridPersistedProperty.Props)).toEqual({ foo: 'bar', foo2: 'bar2' })
    })

    it('should unregister properties from storage', () => {
      agrid.register({ foo: 'bar', foo2: 'bar2' })
      agrid.unregister('foo')
      expect(getEnrichedProperties().foo).toBeUndefined()
      expect(getEnrichedProperties().foo2).toEqual('bar2')
      expect(agrid.getPersistedProperty(AgridPersistedProperty.Props)).toEqual({ foo2: 'bar2' })
    })

    it('should register properties only for the session', () => {
      agrid.registerForSession({ foo: 'bar' })
      expect(getEnrichedProperties()).toMatchObject({ foo: 'bar' })
      expect(agrid.getPersistedProperty(AgridPersistedProperty.Props)).toEqual(undefined)

      agrid.register({ foo: 'bar2' })
      expect(getEnrichedProperties()).toMatchObject({ foo: 'bar' })
      agrid.unregisterForSession('foo')
      expect(getEnrichedProperties()).toMatchObject({ foo: 'bar2' })
    })
  })
})
