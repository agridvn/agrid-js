import { AgridPersistedProperty, AgridV1FlagsResponse } from '@/types'
import { normalizeFlagsResponse } from '@/featureFlagUtils'
import { parseBody, waitForPromises, createTestClient, AgridCoreTestClient, AgridCoreTestClientMocks } from '@/testing'

describe('Agrid Feature Flags v1', () => {
  let agrid: AgridCoreTestClient
  let mocks: AgridCoreTestClientMocks

  jest.useFakeTimers()
  jest.setSystemTime(new Date('2022-01-01'))

  const createMockFeatureFlags = (): any => ({
    'feature-1': true,
    'feature-2': true,
    'feature-variant': 'variant',
    'json-payload': true,
  })

  const createMockFeatureFlagPayloads = (): any => ({
    'feature-1': JSON.stringify({
      color: 'blue',
    }),
    'feature-variant': JSON.stringify([5]),
    'json-payload': '{"a":"payload"}',
  })

  const errorAPIResponse = Promise.resolve({
    status: 400,
    text: () => Promise.resolve('error'),
    json: () =>
      Promise.resolve({
        status: 'error',
      }),
  })

  beforeEach(() => {
    ;[agrid, mocks] = createTestClient('TEST_API_KEY', { flushAt: 1 }, (_mocks) => {
      _mocks.fetch.mockImplementation((url) => {
        if (url.includes('/flags/?v=2&config=true')) {
          return Promise.resolve({
            status: 200,
            text: () => Promise.resolve('ok'),
            json: () =>
              Promise.resolve({
                featureFlags: createMockFeatureFlags(),
                featureFlagPayloads: createMockFeatureFlagPayloads(),
              }),
          })
        }

        return Promise.resolve({
          status: 200,
          text: () => Promise.resolve('ok'),
          json: () =>
            Promise.resolve({
              status: 'ok',
            }),
        })
      })
    })
  })

  describe('featureflags', () => {
    it('getFeatureFlags should return undefined if not loaded', () => {
      expect(agrid.getFeatureFlags()).toEqual(undefined)
    })

    it('getFeatureFlagPayloads should return undefined if not loaded', () => {
      expect(agrid.getFeatureFlagPayloads()).toEqual(undefined)
    })

    it('getFeatureFlag should return undefined if not loaded', () => {
      expect(agrid.getFeatureFlag('my-flag')).toEqual(undefined)
      expect(agrid.getFeatureFlag('feature-1')).toEqual(undefined)
    })

    it('getFeatureFlagPayload should return undefined if not loaded', () => {
      expect(agrid.getFeatureFlagPayload('my-flag')).toEqual(undefined)
    })

    it('isFeatureEnabled should return undefined if not loaded', () => {
      expect(agrid.isFeatureEnabled('my-flag')).toEqual(undefined)
      expect(agrid.isFeatureEnabled('feature-1')).toEqual(undefined)
    })

    it('should load legacy persisted feature flags', () => {
      agrid.setPersistedProperty(AgridPersistedProperty.FeatureFlags, createMockFeatureFlags())
      expect(agrid.getFeatureFlags()).toEqual(createMockFeatureFlags())
    })

    it('should only call fetch once if already calling', async () => {
      expect(mocks.fetch).toHaveBeenCalledTimes(0)
      agrid.reloadFeatureFlagsAsync()
      agrid.reloadFeatureFlagsAsync()
      const flags = await agrid.reloadFeatureFlagsAsync()
      expect(mocks.fetch).toHaveBeenCalledTimes(1)
      expect(flags).toEqual(createMockFeatureFlags())
    })

    it('should emit featureflags event when flags are loaded', async () => {
      const receivedFlags: any[] = []
      const unsubscribe = agrid.onFeatureFlags((flags) => {
        receivedFlags.push(flags)
      })

      await agrid.reloadFeatureFlagsAsync()
      unsubscribe()

      expect(receivedFlags).toEqual([createMockFeatureFlags()])
    })

    describe('when loaded', () => {
      beforeEach(() => {
        agrid.reloadFeatureFlags()
      })

      it('should return the value of a flag', async () => {
        expect(agrid.getFeatureFlag('feature-1')).toEqual(true)
        expect(agrid.getFeatureFlag('feature-variant')).toEqual('variant')
        expect(agrid.getFeatureFlag('feature-missing')).toEqual(false)
      })

      it('should return payload of matched flags only', async () => {
        expect(agrid.getFeatureFlagPayload('feature-variant')).toEqual([5])
        expect(agrid.getFeatureFlagPayload('feature-1')).toEqual({
          color: 'blue',
        })

        expect(agrid.getFeatureFlagPayload('feature-2')).toEqual(null)
      })

      describe('when errored out', () => {
        beforeEach(() => {
          ;[agrid, mocks] = createTestClient('TEST_API_KEY', { flushAt: 1 }, (_mocks) => {
            _mocks.fetch.mockImplementation((url) => {
              if (url.includes('/flags/')) {
                return Promise.resolve({
                  status: 400,
                  text: () => Promise.resolve('ok'),
                  json: () =>
                    Promise.resolve({
                      error: 'went wrong',
                    }),
                })
              }

              return errorAPIResponse
            })
          })

          agrid.reloadFeatureFlags()
        })

        it('should return undefined', async () => {
          expect(mocks.fetch).toHaveBeenCalledWith('https://app.agrid.com/flags/?v=2&config=true', {
            body: JSON.stringify({
              token: 'TEST_API_KEY',
              distinct_id: agrid.getDistinctId(),
              groups: {},
              person_properties: {},
              group_properties: {},
              $anon_distinct_id: agrid.getAnonymousId(),
            }),
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'agrid-core-tests',
            },
            signal: expect.anything(),
          })

          expect(agrid.getFeatureFlag('feature-1')).toEqual(undefined)
          expect(agrid.getFeatureFlag('feature-variant')).toEqual(undefined)
          expect(agrid.getFeatureFlag('feature-missing')).toEqual(undefined)

          expect(agrid.isFeatureEnabled('feature-1')).toEqual(undefined)
          expect(agrid.isFeatureEnabled('feature-variant')).toEqual(undefined)
          expect(agrid.isFeatureEnabled('feature-missing')).toEqual(undefined)

          expect(agrid.getFeatureFlagPayloads()).toEqual(undefined)
          expect(agrid.getFeatureFlagPayload('feature-1')).toEqual(undefined)
        })
      })

      describe('when subsequent flags calls return partial results', () => {
        beforeEach(() => {
          ;[agrid, mocks] = createTestClient('TEST_API_KEY', { flushAt: 1 }, (_mocks) => {
            _mocks.fetch
              .mockImplementationOnce((url) => {
                if (url.includes('/flags/?v=2&config=true')) {
                  return Promise.resolve({
                    status: 200,
                    text: () => Promise.resolve('ok'),
                    json: () =>
                      Promise.resolve({
                        featureFlags: createMockFeatureFlags(),
                      }),
                  })
                }
                return errorAPIResponse
              })
              .mockImplementationOnce((url) => {
                if (url.includes('/flags/?v=2&config=true')) {
                  return Promise.resolve({
                    status: 200,
                    text: () => Promise.resolve('ok'),
                    json: () =>
                      Promise.resolve({
                        featureFlags: { 'x-flag': 'x-value', 'feature-1': false },
                        errorsWhileComputingFlags: true,
                      }),
                  })
                }

                return errorAPIResponse
              })
              .mockImplementation(() => {
                return errorAPIResponse
              })
          })

          agrid.reloadFeatureFlags()
        })

        it('should return combined results', async () => {
          expect(mocks.fetch).toHaveBeenCalledWith('https://app.agrid.com/flags/?v=2&config=true', {
            body: JSON.stringify({
              token: 'TEST_API_KEY',
              distinct_id: agrid.getDistinctId(),
              groups: {},
              person_properties: {},
              group_properties: {},
              $anon_distinct_id: agrid.getAnonymousId(),
            }),
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'agrid-core-tests',
            },
            signal: expect.anything(),
          })

          expect(agrid.getFeatureFlags()).toEqual({
            'feature-1': true,
            'feature-2': true,
            'json-payload': true,
            'feature-variant': 'variant',
          })

          await agrid.reloadFeatureFlagsAsync()

          expect(mocks.fetch).toHaveBeenCalledWith('https://app.agrid.com/flags/?v=2&config=true', {
            body: JSON.stringify({
              token: 'TEST_API_KEY',
              distinct_id: agrid.getDistinctId(),
              groups: {},
              person_properties: {},
              group_properties: {},
              $anon_distinct_id: agrid.getAnonymousId(),
            }),
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'agrid-core-tests',
            },
            signal: expect.anything(),
          })

          expect(agrid.getFeatureFlags()).toEqual({
            'feature-1': false,
            'feature-2': true,
            'json-payload': true,
            'feature-variant': 'variant',
            'x-flag': 'x-value',
          })

          expect(agrid.getFeatureFlag('feature-1')).toEqual(false)
          expect(agrid.getFeatureFlag('feature-variant')).toEqual('variant')
          expect(agrid.getFeatureFlag('feature-missing')).toEqual(false)
          expect(agrid.getFeatureFlag('x-flag')).toEqual('x-value')

          expect(agrid.isFeatureEnabled('feature-1')).toEqual(false)
          expect(agrid.isFeatureEnabled('feature-variant')).toEqual(true)
          expect(agrid.isFeatureEnabled('feature-missing')).toEqual(false)
          expect(agrid.isFeatureEnabled('x-flag')).toEqual(true)
        })
      })

      describe('when subsequent flags calls return results without errors', () => {
        beforeEach(() => {
          ;[agrid, mocks] = createTestClient('TEST_API_KEY', { flushAt: 1 }, (_mocks) => {
            _mocks.fetch
              .mockImplementationOnce((url) => {
                if (url.includes('/flags/?v=2&config=true')) {
                  return Promise.resolve({
                    status: 200,
                    text: () => Promise.resolve('ok'),
                    json: () =>
                      Promise.resolve({
                        featureFlags: createMockFeatureFlags(),
                      }),
                  })
                }
                return errorAPIResponse
              })
              .mockImplementationOnce((url) => {
                if (url.includes('/flags/?v=2&config=true')) {
                  return Promise.resolve({
                    status: 200,
                    text: () => Promise.resolve('ok'),
                    json: () =>
                      Promise.resolve({
                        featureFlags: { 'x-flag': 'x-value', 'feature-1': false },
                        errorsWhileComputingFlags: false,
                      }),
                  })
                }

                return errorAPIResponse
              })
              .mockImplementation(() => {
                return errorAPIResponse
              })
          })

          agrid.reloadFeatureFlags()
        })

        it('should return only latest results', async () => {
          expect(mocks.fetch).toHaveBeenCalledWith('https://app.agrid.com/flags/?v=2&config=true', {
            body: JSON.stringify({
              token: 'TEST_API_KEY',
              distinct_id: agrid.getDistinctId(),
              groups: {},
              person_properties: {},
              group_properties: {},
              $anon_distinct_id: agrid.getAnonymousId(),
            }),
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'agrid-core-tests',
            },
            signal: expect.anything(),
          })

          expect(agrid.getFeatureFlags()).toEqual({
            'feature-1': true,
            'feature-2': true,
            'json-payload': true,
            'feature-variant': 'variant',
          })

          await agrid.reloadFeatureFlagsAsync()

          expect(mocks.fetch).toHaveBeenCalledWith('https://app.agrid.com/flags/?v=2&config=true', {
            body: JSON.stringify({
              token: 'TEST_API_KEY',
              distinct_id: agrid.getDistinctId(),
              groups: {},
              person_properties: {},
              group_properties: {},
              $anon_distinct_id: agrid.getAnonymousId(),
            }),
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'agrid-core-tests',
            },
            signal: expect.anything(),
          })

          expect(agrid.getFeatureFlags()).toEqual({
            'feature-1': false,
            'x-flag': 'x-value',
          })

          expect(agrid.getFeatureFlag('feature-1')).toEqual(false)
          expect(agrid.getFeatureFlag('feature-variant')).toEqual(false)
          expect(agrid.getFeatureFlag('feature-missing')).toEqual(false)
          expect(agrid.getFeatureFlag('x-flag')).toEqual('x-value')

          expect(agrid.isFeatureEnabled('feature-1')).toEqual(false)
          expect(agrid.isFeatureEnabled('feature-variant')).toEqual(false)
          expect(agrid.isFeatureEnabled('feature-missing')).toEqual(false)
          expect(agrid.isFeatureEnabled('x-flag')).toEqual(true)
        })
      })

      it('should return the boolean value of a flag', async () => {
        expect(agrid.isFeatureEnabled('feature-1')).toEqual(true)
        expect(agrid.isFeatureEnabled('feature-variant')).toEqual(true)
        expect(agrid.isFeatureEnabled('feature-missing')).toEqual(false)
      })

      it('should reload if groups are set', async () => {
        agrid.group('my-group', 'is-great')
        await waitForPromises()
        expect(mocks.fetch).toHaveBeenCalledTimes(2)
        expect(JSON.parse((mocks.fetch.mock.calls[1][1].body as string) || '')).toMatchObject({
          groups: { 'my-group': 'is-great' },
        })
      })

      it('should capture $feature_flag_called when called', async () => {
        expect(agrid.getFeatureFlag('feature-1')).toEqual(true)
        await waitForPromises()
        expect(mocks.fetch).toHaveBeenCalledTimes(2)

        expect(parseBody(mocks.fetch.mock.calls[1])).toMatchObject({
          batch: [
            {
              event: '$feature_flag_called',
              distinct_id: agrid.getDistinctId(),
              properties: {
                $feature_flag: 'feature-1',
                $feature_flag_response: true,
                '$feature/feature-1': true,
                $used_bootstrap_value: false,
              },
              type: 'capture',
            },
          ],
        })

        expect(agrid.getFeatureFlag('feature-1')).toEqual(true)
        expect(mocks.fetch).toHaveBeenCalledTimes(2)
      })

      it('should capture $feature_flag_called again if new flags', async () => {
        expect(agrid.getFeatureFlag('feature-1')).toEqual(true)
        await waitForPromises()
        expect(mocks.fetch).toHaveBeenCalledTimes(2)

        expect(parseBody(mocks.fetch.mock.calls[1])).toMatchObject({
          batch: [
            {
              event: '$feature_flag_called',
              distinct_id: agrid.getDistinctId(),
              properties: {
                $feature_flag: 'feature-1',
                $feature_flag_response: true,
                '$feature/feature-1': true,
                $used_bootstrap_value: false,
              },
              type: 'capture',
            },
          ],
        })

        await agrid.reloadFeatureFlagsAsync()
        agrid.getFeatureFlag('feature-1')

        await waitForPromises()
        expect(mocks.fetch).toHaveBeenCalledTimes(4)

        expect(parseBody(mocks.fetch.mock.calls[3])).toMatchObject({
          batch: [
            {
              event: '$feature_flag_called',
              distinct_id: agrid.getDistinctId(),
              properties: {
                $feature_flag: 'feature-1',
                $feature_flag_response: true,
                '$feature/feature-1': true,
                $used_bootstrap_value: false,
              },
              type: 'capture',
            },
          ],
        })
      })

      it('should capture $feature_flag_called when called, but not add all cached flags', async () => {
        expect(agrid.getFeatureFlag('feature-1')).toEqual(true)
        await waitForPromises()
        expect(mocks.fetch).toHaveBeenCalledTimes(2)

        expect(parseBody(mocks.fetch.mock.calls[1])).toMatchObject({
          batch: [
            {
              event: '$feature_flag_called',
              distinct_id: agrid.getDistinctId(),
              properties: {
                $feature_flag: 'feature-1',
                $feature_flag_response: true,
                '$feature/feature-1': true,
                $used_bootstrap_value: false,
              },
              type: 'capture',
            },
          ],
        })

        expect(agrid.getFeatureFlag('feature-1')).toEqual(true)
        expect(mocks.fetch).toHaveBeenCalledTimes(2)
      })

      it('should persist feature flags', () => {
        const expectedFeatureFlags = {
          featureFlags: createMockFeatureFlags(),
          featureFlagPayloads: createMockFeatureFlagPayloads(),
        }
        const normalizedFeatureFlags = normalizeFlagsResponse(expectedFeatureFlags as AgridV1FlagsResponse)
        expect(agrid.getPersistedProperty(AgridPersistedProperty.FeatureFlagDetails)).toEqual(normalizedFeatureFlags)
      })

      it('should include feature flags in subsequent captures', async () => {
        agrid.capture('test-event', { foo: 'bar' })

        await waitForPromises()

        expect(parseBody(mocks.fetch.mock.calls[1])).toMatchObject({
          batch: [
            {
              event: 'test-event',
              distinct_id: agrid.getDistinctId(),
              properties: {
                $active_feature_flags: ['feature-1', 'feature-2', 'feature-variant', 'json-payload'],
                '$feature/feature-1': true,
                '$feature/feature-2': true,
                '$feature/json-payload': true,
                '$feature/feature-variant': 'variant',
              },
              type: 'capture',
            },
          ],
        })
      })

      it('should override flags', () => {
        agrid.overrideFeatureFlag({
          'feature-2': false,
          'feature-variant': 'control',
        })
        expect(agrid.getFeatureFlags()).toEqual({
          'json-payload': true,
          'feature-1': true,
          'feature-variant': 'control',
        })
      })
    })

    describe('when quota limited', () => {
      beforeEach(() => {
        ;[agrid, mocks] = createTestClient('TEST_API_KEY', { flushAt: 1 }, (_mocks) => {
          _mocks.fetch.mockImplementation((url) => {
            if (url.includes('/flags/')) {
              return Promise.resolve({
                status: 200,
                text: () => Promise.resolve('ok'),
                json: () =>
                  Promise.resolve({
                    quotaLimited: ['feature_flags'],
                    featureFlags: {},
                    featureFlagPayloads: {},
                  }),
              })
            }
            return errorAPIResponse
          })
        })

        agrid.reloadFeatureFlags()
      })

      it('should unset all flags when feature_flags is quota limited', async () => {
        expect(agrid.getFeatureFlags()).toEqual(undefined)

        await agrid.reloadFeatureFlagsAsync()
        expect(agrid.getFeatureFlags()).toEqual(undefined)
      })
    })
  })
})
