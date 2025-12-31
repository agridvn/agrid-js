import { Agrid } from '@/entrypoints/index.node'
import { AgridOptions } from '@/types'
import { apiImplementation, apiImplementationV4, waitForPromises } from './utils'
import { AgridV2FlagsResponse } from '@agrid/core'

jest.spyOn(console, 'debug').mockImplementation()

const mockedFetch = jest.spyOn(globalThis, 'fetch').mockImplementation()

const agridImmediateResolveOptions: AgridOptions = {
  fetchRetryCount: 0,
}

describe('flags v2', () => {
  describe('getFeatureFlag v2', () => {
    it('returns undefined if the flag is not found', async () => {
      const flagsResponse: AgridV2FlagsResponse = {
        flags: {},
        errorsWhileComputingFlags: false,
        requestId: '0152a345-295f-4fba-adac-2e6ea9c91082',
      }
      mockedFetch.mockImplementation(apiImplementationV4(flagsResponse))

      const agrid = new Agrid('TEST_API_KEY', {
        host: 'http://example.com',
        ...agridImmediateResolveOptions,
      })
      let capturedMessage: any
      agrid.on('capture', (message) => {
        capturedMessage = message
      })

      const result = await agrid.getFeatureFlag('non-existent-flag', 'some-distinct-id')

      expect(result).toBe(undefined)
      expect(mockedFetch).toHaveBeenCalledWith('http://example.com/flags/?v=2&config=true', expect.any(Object))

      await waitForPromises()
      expect(capturedMessage).toMatchObject({
        distinct_id: 'some-distinct-id',
        event: '$feature_flag_called',
        library: agrid.getLibraryId(),
        library_version: agrid.getLibraryVersion(),
        properties: {
          '$feature/non-existent-flag': undefined,
          $feature_flag: 'non-existent-flag',
          $feature_flag_response: undefined,
          $feature_flag_request_id: '0152a345-295f-4fba-adac-2e6ea9c91082',
          $groups: undefined,
          $lib: agrid.getLibraryId(),
          $lib_version: agrid.getLibraryVersion(),
          locally_evaluated: false,
        },
      })
    })

    it.each([
      {
        key: 'variant-flag',
        expectedResponse: 'variant-value',
        expectedReason: 'Matched condition set 3',
        expectedId: 2,
        expectedVersion: 23,
      },
      {
        key: 'boolean-flag',
        expectedResponse: true,
        expectedReason: 'Matched condition set 1',
        expectedId: 1,
        expectedVersion: 12,
      },
      {
        key: 'non-matching-flag',
        expectedResponse: false,
        expectedReason: 'Did not match any condition',
        expectedId: 3,
        expectedVersion: 2,
      },
    ])(
      'captures a feature flag called event with extra metadata when the flag is found',
      async ({ key, expectedResponse, expectedReason, expectedId, expectedVersion }) => {
        const flagsResponse: AgridV2FlagsResponse = {
          flags: {
            'variant-flag': {
              key: 'variant-flag',
              enabled: true,
              variant: 'variant-value',
              reason: {
                code: 'variant',
                condition_index: 2,
                description: 'Matched condition set 3',
              },
              metadata: {
                id: 2,
                version: 23,
                payload: '{"key": "value"}',
                description: 'description',
              },
            },
            'boolean-flag': {
              key: 'boolean-flag',
              enabled: true,
              variant: undefined,
              reason: {
                code: 'boolean',
                condition_index: 1,
                description: 'Matched condition set 1',
              },
              metadata: {
                id: 1,
                version: 12,
                payload: undefined,
                description: 'description',
              },
            },
            'non-matching-flag': {
              key: 'non-matching-flag',
              enabled: false,
              variant: undefined,
              reason: {
                code: 'boolean',
                condition_index: 1,
                description: 'Did not match any condition',
              },
              metadata: {
                id: 3,
                version: 2,
                payload: undefined,
                description: 'description',
              },
            },
          },
          errorsWhileComputingFlags: false,
          requestId: '0152a345-295f-4fba-adac-2e6ea9c91082',
        }
        mockedFetch.mockImplementation(apiImplementationV4(flagsResponse))

        const agrid = new Agrid('TEST_API_KEY', {
          host: 'http://example.com',
          ...agridImmediateResolveOptions,
        })
        let capturedMessage: any
        agrid.on('capture', (message) => {
          capturedMessage = message
        })

        const result = await agrid.getFeatureFlag(key, 'some-distinct-id')

        expect(result).toBe(expectedResponse)
        expect(mockedFetch).toHaveBeenCalledWith('http://example.com/flags/?v=2&config=true', expect.any(Object))

        await waitForPromises()
        expect(capturedMessage).toMatchObject({
          distinct_id: 'some-distinct-id',
          event: '$feature_flag_called',
          library: agrid.getLibraryId(),
          library_version: agrid.getLibraryVersion(),
          properties: {
            [`$feature/${key}`]: expectedResponse,
            $feature_flag: key,
            $feature_flag_response: expectedResponse,
            $feature_flag_id: expectedId,
            $feature_flag_version: expectedVersion,
            $feature_flag_reason: expectedReason,
            $feature_flag_request_id: '0152a345-295f-4fba-adac-2e6ea9c91082',
            $groups: undefined,
            $lib: agrid.getLibraryId(),
            $lib_version: agrid.getLibraryVersion(),
            locally_evaluated: false,
          },
        })
      }
    )

    describe('getFeatureFlagPayload v2', () => {
      it('returns payload', async () => {
        mockedFetch.mockImplementation(
          apiImplementationV4({
            flags: {
              'flag-with-payload': {
                key: 'flag-with-payload',
                enabled: true,
                variant: undefined,
                reason: {
                  code: 'boolean',
                  condition_index: 1,
                  description: 'Matched condition set 2',
                },
                metadata: {
                  id: 1,
                  version: 12,
                  payload: '[0, 1, 2]',
                  description: 'description',
                },
              },
            },
            errorsWhileComputingFlags: false,
          })
        )

        const agrid = new Agrid('TEST_API_KEY', {
          host: 'http://example.com',
          ...agridImmediateResolveOptions,
        })
        let capturedMessage: any
        agrid.on('capture', (message) => {
          capturedMessage = message
        })

        const result = await agrid.getFeatureFlagPayload('flag-with-payload', 'some-distinct-id')

        expect(result).toEqual([0, 1, 2])
        expect(mockedFetch).toHaveBeenCalledWith('http://example.com/flags/?v=2&config=true', expect.any(Object))

        await waitForPromises()
        expect(capturedMessage).toBeUndefined()
      })
    })
  })

  describe('error handling', () => {
    let agrid: Agrid
    describe.each([
      {
        case: 'JSON error response',
        mock: apiImplementationV4({
          status: 400,
          json: () => Promise.resolve({ error: 'error response' }),
        }),
      },
      {
        case: 'undefined response',
        mock: apiImplementationV4({
          status: 400,
          json: () => Promise.resolve(undefined),
        }),
      },
      {
        case: 'null response',
        mock: apiImplementationV4({
          status: 400,
          json: () => Promise.resolve(null),
        }),
      },
      {
        case: 'empty response',
        mock: apiImplementationV4({
          status: 400,
          json: () => Promise.resolve({}),
        }),
      },
      {
        case: 'network error',
        mock: () => Promise.reject(new Error('Network error')),
      },
      {
        case: 'invalid JSON',
        mock: apiImplementationV4({
          status: 500,
          json: () => Promise.reject(new Error('Invalid JSON')),
        }),
      },
    ])('when $case', ({ mock }) => {
      beforeEach(() => {
        agrid = new Agrid('TEST_API_KEY', {
          host: 'http://example.com',
          ...agridImmediateResolveOptions,
        })
        mockedFetch.mockImplementation(mock)
      })

      it('getFeatureFlag returns undefined', async () => {
        expect(await agrid.getFeatureFlag('error-flag', 'some-distinct-id')).toBe(undefined)
      })

      it('isFeatureEnabled returns undefined', async () => {
        expect(await agrid.isFeatureEnabled('error-flag', 'some-distinct-id')).toBe(undefined)
      })

      it('getFeatureFlagPayload returns undefined', async () => {
        expect(await agrid.getFeatureFlagPayload('error-flag', 'some-distinct-id')).toBe(undefined)
      })

      it('getAllFlags returns empty object', async () => {
        expect(await agrid.getAllFlags('some-distinct-id')).toEqual({})
      })

      it('getAllFlagsAndPayloads returns object with empty flags and payloads', async () => {
        expect(await agrid.getAllFlagsAndPayloads('some-distinct-id')).toEqual({
          featureFlags: {},
          featureFlagPayloads: {},
        })
      })

      it('captures no events', async () => {
        let capturedMessage: any
        agrid.on('capture', (message) => {
          capturedMessage = message
        })

        await agrid.getFeatureFlag('error-flag', 'some-distinct-id')
        await waitForPromises()
        expect(capturedMessage).toBeUndefined()
      })
    })
  })
})

describe('flags v1', () => {
  describe('getFeatureFlag v1', () => {
    it('returns undefined if the flag is not found', async () => {
      mockedFetch.mockImplementation(apiImplementation({ decideFlags: {} }))

      const agrid = new Agrid('TEST_API_KEY', {
        host: 'http://example.com',
        ...agridImmediateResolveOptions,
      })
      let capturedMessage: any
      agrid.on('capture', (message) => {
        capturedMessage = message
      })

      const result = await agrid.getFeatureFlag('non-existent-flag', 'some-distinct-id')

      expect(result).toBe(undefined)
      expect(mockedFetch).toHaveBeenCalledWith('http://example.com/flags/?v=2&config=true', expect.any(Object))

      await waitForPromises()
      expect(capturedMessage).toMatchObject({
        distinct_id: 'some-distinct-id',
        event: '$feature_flag_called',
        library: agrid.getLibraryId(),
        library_version: agrid.getLibraryVersion(),
        properties: {
          '$feature/non-existent-flag': undefined,
          $feature_flag: 'non-existent-flag',
          $feature_flag_response: undefined,
          $groups: undefined,
          $lib: agrid.getLibraryId(),
          $lib_version: agrid.getLibraryVersion(),
          locally_evaluated: false,
        },
      })
    })
  })

  describe('getFeatureFlagPayload v1', () => {
    it('returns payload', async () => {
      mockedFetch.mockImplementation(
        apiImplementation({
          decideFlags: {
            'flag-with-payload': true,
          },
          flagsPayloads: {
            'flag-with-payload': [0, 1, 2],
          },
        })
      )

      const agrid = new Agrid('TEST_API_KEY', {
        host: 'http://example.com',
        ...agridImmediateResolveOptions,
      })
      let capturedMessage: any = undefined
      agrid.on('capture', (message) => {
        capturedMessage = message
      })

      const result = await agrid.getFeatureFlagPayload('flag-with-payload', 'some-distinct-id')

      expect(result).toEqual([0, 1, 2])
      expect(mockedFetch).toHaveBeenCalledWith('http://example.com/flags/?v=2&config=true', expect.any(Object))

      await waitForPromises()
      expect(capturedMessage).toBeUndefined()
    })
  })
})
