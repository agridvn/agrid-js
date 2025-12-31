import { AgridPersistedProperty } from '@/types'
import { createTestClient, AgridCoreTestClient, AgridCoreTestClientMocks } from '@/testing'

describe('Agrid Core', () => {
  let agrid: AgridCoreTestClient
  let mocks: AgridCoreTestClientMocks

  jest.useFakeTimers()
  jest.setSystemTime(new Date('2022-01-01'))

  beforeEach(() => {
    ;[agrid, mocks] = createTestClient('TEST_API_KEY', { flushAt: 1 })
  })

  describe('setGroupPropertiesForFlags', () => {
    it('should store setGroupPropertiesForFlags as persisted with group_properties key', () => {
      const props = { organisation: { name: 'bar' }, project: { name: 'baz' } }
      agrid.setGroupPropertiesForFlags(props)

      expect(mocks.storage.setItem).toHaveBeenCalledWith('group_properties', props)

      expect(agrid.getPersistedProperty(AgridPersistedProperty.GroupProperties)).toEqual(props)
    })

    it('should update setGroupPropertiesForFlags appropriately', () => {
      const props = { organisation: { name: 'bar' }, project: { name: 'baz' } }
      agrid.setGroupPropertiesForFlags(props)

      expect(agrid.getPersistedProperty(AgridPersistedProperty.GroupProperties)).toEqual(props)

      agrid.setGroupPropertiesForFlags({ organisation: { name: 'bar2' }, project: { name2: 'baz' } })
      expect(agrid.getPersistedProperty(AgridPersistedProperty.GroupProperties)).toEqual({
        organisation: { name: 'bar2' },
        project: { name: 'baz', name2: 'baz' },
      })

      agrid.setGroupPropertiesForFlags({ organisation2: { name: 'bar' } })
      expect(agrid.getPersistedProperty(AgridPersistedProperty.GroupProperties)).toEqual({
        organisation: { name: 'bar2' },
        project: { name: 'baz', name2: 'baz' },
        organisation2: { name: 'bar' },
      })
    })

    it('should clear setGroupPropertiesForFlags on reset', () => {
      const props = { organisation: { name: 'bar' }, project: { name: 'baz' } }
      agrid.setGroupPropertiesForFlags(props)
      expect(agrid.getPersistedProperty(AgridPersistedProperty.GroupProperties)).toEqual(props)

      agrid.reset()
      expect(agrid.getPersistedProperty(AgridPersistedProperty.GroupProperties)).toEqual(undefined)

      agrid.setGroupPropertiesForFlags(props)
      expect(agrid.getPersistedProperty(AgridPersistedProperty.GroupProperties)).toEqual(props)
    })
  })

  describe('setPersonPropertiesForFlags', () => {
    it('should store setPersonPropertiesForFlags as persisted with person_properties key', () => {
      const props = { organisation: 'bar', project: 'baz' }
      agrid.setPersonPropertiesForFlags(props)

      expect(mocks.storage.setItem).toHaveBeenCalledWith('person_properties', props)

      expect(agrid.getPersistedProperty(AgridPersistedProperty.PersonProperties)).toEqual(props)
    })

    it('should update setPersonPropertiesForFlags appropriately', () => {
      const props = { organisation: 'bar', project: 'baz' }
      agrid.setPersonPropertiesForFlags(props)

      expect(agrid.getPersistedProperty(AgridPersistedProperty.PersonProperties)).toEqual(props)

      agrid.setPersonPropertiesForFlags({ organisation: 'bar2', project2: 'baz' })
      expect(agrid.getPersistedProperty(AgridPersistedProperty.PersonProperties)).toEqual({
        organisation: 'bar2',
        project: 'baz',
        project2: 'baz',
      })

      agrid.setPersonPropertiesForFlags({ organisation2: 'bar' })
      expect(agrid.getPersistedProperty(AgridPersistedProperty.PersonProperties)).toEqual({
        organisation: 'bar2',
        project: 'baz',
        project2: 'baz',
        organisation2: 'bar',
      })
    })

    it('should clear setPersonPropertiesForFlags on reset', () => {
      const props = { organisation: 'bar', project: 'baz' }
      agrid.setPersonPropertiesForFlags(props)
      expect(agrid.getPersistedProperty(AgridPersistedProperty.PersonProperties)).toEqual(props)

      agrid.reset()
      expect(agrid.getPersistedProperty(AgridPersistedProperty.PersonProperties)).toEqual(undefined)

      agrid.setPersonPropertiesForFlags(props)
      expect(agrid.getPersistedProperty(AgridPersistedProperty.PersonProperties)).toEqual(props)
    })
  })
})
