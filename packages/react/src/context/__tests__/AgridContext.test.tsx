import * as React from 'react'
import { render } from '@testing-library/react'
import { AgridProvider, Agrid } from '..'

describe('AgridContext component', () => {
    const agrid = {} as unknown as Agrid

    it('should return a client instance from the context if available', () => {
        render(
            <AgridProvider client={agrid}>
                <div>Hello</div>
            </AgridProvider>
        )
    })

    it("should not throw error if a client instance can't be found in the context", () => {
        ;(window as any)['console']['warn'] = jest.fn()

        expect(() => {
            render(
                <AgridProvider client={undefined as any}>
                    <div>Hello</div>
                </AgridProvider>
            )
        }).not.toThrow()

        expect((window as any)['console']['warn']).toHaveBeenCalledWith(
            '[Agrid.js] No `apiKey` or `client` were provided to `AgridProvider`. Using default global `window.agrid` instance. You must initialize it manually. This is not recommended behavior.'
        )
    })
})
