import { AgridPersistedProperty } from '@/types'
import { createTestClient, AgridCoreTestClient, AgridCoreTestClientMocks } from '@/testing'

describe('Agrid Core', () => {
  let agrid: AgridCoreTestClient
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mocks: AgridCoreTestClientMocks

  beforeEach(() => {
    ;[agrid, mocks] = createTestClient('TEST_API_KEY', {})
  })

  describe('reset', () => {
    it('should reset the storage when called', () => {
      const distinctId = agrid.getDistinctId()
      agrid.overrideFeatureFlag({
        foo: 'bar',
      })
      agrid.register({
        prop: 1,
      })

      expect(agrid.getPersistedProperty(AgridPersistedProperty.AnonymousId)).toEqual(distinctId)
      expect(agrid.getPersistedProperty(AgridPersistedProperty.OverrideFeatureFlags)).toEqual({ foo: 'bar' })
      expect(agrid.getPersistedProperty(AgridPersistedProperty.Props)).toEqual({ prop: 1 })

      agrid.reset()

      expect(agrid.getDistinctId()).not.toEqual(distinctId)
      expect(agrid.getPersistedProperty(AgridPersistedProperty.OverrideFeatureFlags)).toEqual(undefined)
      expect(agrid.getPersistedProperty(AgridPersistedProperty.Props)).toEqual(undefined)
    })

    it("shouldn't reset the events capture queue", async () => {
      agrid.getDistinctId()
      agrid.capture('custom-event')

      const expectedQueue = [
        {
          message: expect.objectContaining({
            event: 'custom-event',
            library: 'agrid-core-tests',
          }),
        },
      ]

      expect(agrid.getPersistedProperty(AgridPersistedProperty.Queue)).toEqual(expectedQueue)
      agrid.reset()

      const newDistinctId = agrid.getDistinctId()

      expect(agrid.getPersistedProperty(AgridPersistedProperty.Queue)).toEqual(expectedQueue)
      expect(agrid.getPersistedProperty(AgridPersistedProperty.AnonymousId)).toEqual(newDistinctId)
    })

    it('should not reset specific props when set', () => {
      const distinctId = agrid.getDistinctId()
      agrid.overrideFeatureFlag({
        foo: 'bar',
      })
      agrid.register({
        prop: 1,
      })

      expect(agrid.getPersistedProperty(AgridPersistedProperty.AnonymousId)).toEqual(distinctId)
      expect(agrid.getPersistedProperty(AgridPersistedProperty.OverrideFeatureFlags)).toEqual({ foo: 'bar' })
      expect(agrid.getPersistedProperty(AgridPersistedProperty.Props)).toEqual({ prop: 1 })

      agrid.reset([AgridPersistedProperty.OverrideFeatureFlags])

      expect(agrid.getDistinctId()).not.toEqual(distinctId)
      expect(agrid.getPersistedProperty(AgridPersistedProperty.OverrideFeatureFlags)).toEqual({ foo: 'bar' })
      expect(agrid.getPersistedProperty(AgridPersistedProperty.Props)).toEqual(undefined)
    })
  })
})
