import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { Agrid, AgridProvider } from '../../context'
import { AgridCaptureOnViewed } from '../'
import '@testing-library/jest-dom'

describe('AgridCaptureOnViewed component', () => {
    let mockObserverCallback: any = null

    let fakeAgrid: Agrid

    beforeEach(() => {
        fakeAgrid = {
            capture: jest.fn(),
        } as unknown as Agrid

        const mockIntersectionObserver = jest.fn((callback) => {
            mockObserverCallback = callback
            return {
                observe: jest.fn(),
                unobserve: jest.fn(),
                disconnect: jest.fn(),
            }
        })

        mockIntersectionObserver.prototype = {}
        ;(window as any)['IntersectionObserver'] = mockIntersectionObserver as unknown as typeof IntersectionObserver
    })

    it('should render children', () => {
        render(
            <AgridProvider client={fakeAgrid}>
                <AgridCaptureOnViewed name="test-element">
                    <div data-testid="child">Hello</div>
                </AgridCaptureOnViewed>
            </AgridProvider>
        )

        expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('should track when element comes into view', () => {
        render(
            <AgridProvider client={fakeAgrid}>
                <AgridCaptureOnViewed name="test-element">
                    <div data-testid="child">Hello</div>
                </AgridCaptureOnViewed>
            </AgridProvider>
        )

        expect(fakeAgrid.capture).not.toHaveBeenCalled()

        mockObserverCallback([{ isIntersecting: true }])

        expect(fakeAgrid.capture).toHaveBeenCalledWith('$element_viewed', {
            element_name: 'test-element',
        })
        expect(fakeAgrid.capture).toHaveBeenCalledTimes(1)
    })

    it('should only track visibility once', () => {
        render(
            <AgridProvider client={fakeAgrid}>
                <AgridCaptureOnViewed name="test-element">
                    <div data-testid="child">Hello</div>
                </AgridCaptureOnViewed>
            </AgridProvider>
        )

        mockObserverCallback([{ isIntersecting: true }])
        expect(fakeAgrid.capture).toHaveBeenCalledTimes(1)

        mockObserverCallback([{ isIntersecting: true }])
        mockObserverCallback([{ isIntersecting: true }])
        expect(fakeAgrid.capture).toHaveBeenCalledTimes(1)
    })

    it('should include custom properties', () => {
        render(
            <AgridProvider client={fakeAgrid}>
                <AgridCaptureOnViewed name="test-element" properties={{ category: 'hero', priority: 'high' }}>
                    <div data-testid="child">Hello</div>
                </AgridCaptureOnViewed>
            </AgridProvider>
        )

        mockObserverCallback([{ isIntersecting: true }])

        expect(fakeAgrid.capture).toHaveBeenCalledWith('$element_viewed', {
            element_name: 'test-element',
            category: 'hero',
            priority: 'high',
        })
    })

    it('should not track when element is not intersecting', () => {
        render(
            <AgridProvider client={fakeAgrid}>
                <AgridCaptureOnViewed name="test-element">
                    <div data-testid="child">Hello</div>
                </AgridCaptureOnViewed>
            </AgridProvider>
        )

        mockObserverCallback([{ isIntersecting: false }])

        expect(fakeAgrid.capture).not.toHaveBeenCalled()
    })
})
