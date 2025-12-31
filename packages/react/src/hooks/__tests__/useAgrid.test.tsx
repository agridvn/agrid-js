import * as React from 'react'
import { renderHook } from '@testing-library/react-hooks'
import { AgridProvider, Agrid } from '../../context'
import { useAgrid } from '..'

jest.useFakeTimers()

const agrid = { agrid_client: true } as unknown as Agrid

describe('useAgrid hook', () => {
    it('should return the client', () => {
        const { result } = renderHook(() => useAgrid(), {
            wrapper: ({ children }: { children: React.ReactNode }) => (
                <AgridProvider client={agrid}>{children}</AgridProvider>
            ),
        })
        expect(result.current).toEqual(agrid)
    })
})
