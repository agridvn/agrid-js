import { createTestClient, AgridCoreTestClient, AgridCoreTestClientMocks, parseBody, waitForPromises } from '@/testing'

describe('Agrid Core', () => {
  let agrid: AgridCoreTestClient
  let mocks: AgridCoreTestClientMocks

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2022-01-01'))
    ;[agrid, mocks] = createTestClient('TEST_API_KEY', { flushAt: 1 })
  })

  describe('groups', () => {
    it('should store groups as persisted props', () => {
      const groups = { agrid: 'team-1', other: 'key-2' }
      agrid.groups(groups)

      expect(mocks.storage.setItem).toHaveBeenCalledWith('props', {
        $groups: groups,
      })
    })
  })

  describe('group', () => {
    it('should store group as persisted props', () => {
      const groups = { agrid: 'team-1' }
      agrid.groups(groups)
      agrid.group('other', 'foo')
      agrid.group('agrid', 'team-2')

      expect(mocks.storage.setItem).toHaveBeenCalledWith('props', {
        $groups: {
          agrid: 'team-2',
          other: 'foo',
        },
      })
    })

    it('should call groupIdentify if including props', async () => {
      agrid.group('other', 'team', { foo: 'bar' })
      await waitForPromises()

      expect(mocks.fetch).toHaveBeenCalledTimes(2)
      const batchCall = mocks.fetch.mock.calls[1]
      expect(batchCall[0]).toEqual('https://app.agrid.com/batch/')
      expect(parseBody(batchCall)).toMatchObject({
        batch: [
          {
            event: '$groupidentify',
            distinct_id: agrid.getDistinctId(),
            properties: {
              $group_type: 'other',
              $group_key: 'team',
              $group_set: { foo: 'bar' },
            },
            type: 'capture',
          },
        ],
      })
    })
  })

  describe('groupIdentify', () => {
    it('should identify group', async () => {
      agrid.groupIdentify('agrid', 'team-1', { analytics: true })
      await waitForPromises()

      expect(parseBody(mocks.fetch.mock.calls[0])).toMatchObject({
        api_key: 'TEST_API_KEY',
        batch: [
          {
            event: '$groupidentify',
            distinct_id: agrid.getDistinctId(),
            library: 'agrid-core-tests',
            library_version: '2.0.0-alpha',
            properties: {
              $lib: 'agrid-core-tests',
              $lib_version: '2.0.0-alpha',
              $group_type: 'agrid',
              $group_key: 'team-1',
              $group_set: { analytics: true },
            },
            timestamp: '2022-01-01T00:00:00.000Z',
            type: 'capture',
          },
        ],
      })
    })
  })
})
