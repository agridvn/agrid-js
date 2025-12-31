import * as React from 'react'
import { render, act } from '@testing-library/react'
import { AgridProvider, Agrid } from '..'
import posthogJs from 'agrid-js'

jest.mock('agrid-js', () => ({
    __esModule: true,
    default: {
        init: jest.fn(),
        set_config: jest.fn(),
        __loaded: false,
    },
}))

describe('AgridProvider component', () => {
    it('should render children components', () => {
        const agrid = {} as unknown as Agrid
        const { getByText } = render(
            <AgridProvider client={agrid}>
                <div>Test</div>
            </AgridProvider>
        )
        expect(getByText('Test')).toBeTruthy()
    })

    describe('when using apiKey initialization', () => {
        const apiKey = 'test-api-key'
        const initialOptions = { api_host: 'https://app.posthog.com' }
        const updatedOptions = { api_host: 'https://eu.posthog.com' }

        beforeEach(() => {
            jest.clearAllMocks()
        })

        it('should call set_config when options change', () => {
            const { rerender } = render(
                <AgridProvider apiKey={apiKey} options={initialOptions}>
                    <div>Test</div>
                </AgridProvider>
            )

            expect(posthogJs.init).toHaveBeenCalledWith(apiKey, initialOptions)

            act(() => {
                rerender(
                    <AgridProvider apiKey={apiKey} options={updatedOptions}>
                        <div>Test</div>
                    </AgridProvider>
                )
            })

            expect(posthogJs.set_config).toHaveBeenCalledWith(updatedOptions)
        })

        it('should NOT call set_config when we pass new options that are the same as the previous options', () => {
            const { rerender } = render(
                <AgridProvider apiKey={apiKey} options={initialOptions}>
                    <div>Test</div>
                </AgridProvider>
            )

            expect(posthogJs.init).toHaveBeenCalledWith(apiKey, initialOptions)

            const sameOptionsButDifferentReference = { ...initialOptions }
            act(() => {
                rerender(
                    <AgridProvider apiKey={apiKey} options={sameOptionsButDifferentReference}>
                        <div>Test</div>
                    </AgridProvider>
                )
            })

            expect(posthogJs.set_config).not.toHaveBeenCalled()
        })

        it('should warn when attempting to change apiKey', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
            const newApiKey = 'different-api-key'

            const { rerender } = render(
                <AgridProvider apiKey={apiKey} options={initialOptions}>
                    <div>Test</div>
                </AgridProvider>
            )

            expect(posthogJs.init).toHaveBeenCalledWith(apiKey, initialOptions)

            act(() => {
                rerender(
                    <AgridProvider apiKey={newApiKey} options={initialOptions}>
                        <div>Test</div>
                    </AgridProvider>
                )
            })

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('You have provided a different `apiKey` to `AgridProvider`')
            )

            consoleSpy.mockRestore()
        })

        it('warns if posthogJs has been loaded elsewhere', () => {
            ;(posthogJs as any).__loaded = true

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
            render(
                <AgridProvider apiKey={apiKey} options={initialOptions}>
                    <div>Test</div>
                </AgridProvider>
            )

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('`agrid` was already loaded elsewhere. This may cause issues.')
            )

            consoleSpy.mockRestore()
            ;(posthogJs as any).__loaded = false
        })
    })
})
