import * as React from 'react'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { AgridProvider, Agrid } from '../../context'
import { AgridFeature } from '../'
import '@testing-library/jest-dom'

const FEATURE_FLAG_STATUS: Record<string, string | boolean> = {
    multivariate_feature: 'string-value',
    example_feature_payload: 'test',
    test: true,
    test_false: false,
}

const FEATURE_FLAG_PAYLOADS: Record<string, any> = {
    example_feature_payload: {
        id: 1,
        name: 'example_feature_1_payload',
        key: 'example_feature_1_payload',
    },
}

describe('AgridFeature component', () => {
    let agrid: Agrid

    const renderWith = (instance: Agrid, flag = 'test', matchValue: string | boolean | undefined = true) =>
        render(
            <AgridProvider client={instance}>
                <AgridFeature flag={flag} match={matchValue}>
                    <div data-testid="helloDiv">Hello</div>
                </AgridFeature>
            </AgridProvider>
        )

    beforeEach(() => {
        const mockIntersectionObserver = jest.fn()
        mockIntersectionObserver.mockReturnValue({
            observe: () => null,
            unobserve: () => null,
            disconnect: () => null,
        })
        ;(window as any)['IntersectionObserver'] = mockIntersectionObserver as any
        agrid = {
            isFeatureEnabled: (flag: string) => !!FEATURE_FLAG_STATUS[flag],
            getFeatureFlag: (flag: string) => FEATURE_FLAG_STATUS[flag],
            getFeatureFlagPayload: (flag: string) => FEATURE_FLAG_PAYLOADS[flag],
            onFeatureFlags: (callback: any) => {
                const activeFlags: string[] = []
                for (const flag in FEATURE_FLAG_STATUS) {
                    if (FEATURE_FLAG_STATUS[flag]) {
                        activeFlags.push(flag)
                    }
                }
                callback(activeFlags)
                return () => {}
            },
            capture: jest.fn(),
            featureFlags: {
                hasLoadedFlags: true,
            },
        } as unknown as Agrid
    })

    it('should track interactions with the feature component', () => {
        renderWith(agrid)

        fireEvent.click(screen.getByTestId('helloDiv'))
        expect(agrid.capture).toHaveBeenCalledWith('$feature_interaction', {
            feature_flag: 'test',
            $set: { '$feature_interaction/test': true },
        })
        expect(agrid.capture).toHaveBeenCalledTimes(1)
    })

    it('should not fire for every interaction with the feature component', () => {
        renderWith(agrid)

        fireEvent.click(screen.getByTestId('helloDiv'))
        expect(agrid.capture).toHaveBeenCalledWith('$feature_interaction', {
            feature_flag: 'test',
            $set: { '$feature_interaction/test': true },
        })
        expect(agrid.capture).toHaveBeenCalledTimes(1)

        fireEvent.click(screen.getByTestId('helloDiv'))
        fireEvent.click(screen.getByTestId('helloDiv'))
        fireEvent.click(screen.getByTestId('helloDiv'))
        expect(agrid.capture).toHaveBeenCalledTimes(1)
    })

    it('should track an interaction with each child node of the feature component', () => {
        render(
            <AgridProvider client={agrid}>
                <AgridFeature flag={'test'} match={true}>
                    <div data-testid="helloDiv">Hello</div>
                    <div data-testid="worldDiv">World!</div>
                </AgridFeature>
            </AgridProvider>
        )

        fireEvent.click(screen.getByTestId('helloDiv'))
        fireEvent.click(screen.getByTestId('helloDiv'))
        fireEvent.click(screen.getByTestId('worldDiv'))
        fireEvent.click(screen.getByTestId('worldDiv'))
        fireEvent.click(screen.getByTestId('worldDiv'))
        expect(agrid.capture).toHaveBeenCalledWith('$feature_interaction', {
            feature_flag: 'test',
            $set: { '$feature_interaction/test': true },
        })
        expect(agrid.capture).toHaveBeenCalledTimes(1)
    })

    it('should not fire events when interaction is disabled', () => {
        render(
            <AgridProvider client={agrid}>
                <AgridFeature flag={'test'} match={true} trackInteraction={false}>
                    <div data-testid="helloDiv">Hello</div>
                </AgridFeature>
            </AgridProvider>
        )

        fireEvent.click(screen.getByTestId('helloDiv'))
        expect(agrid.capture).not.toHaveBeenCalled()

        fireEvent.click(screen.getByTestId('helloDiv'))
        fireEvent.click(screen.getByTestId('helloDiv'))
        fireEvent.click(screen.getByTestId('helloDiv'))
        expect(agrid.capture).not.toHaveBeenCalled()
    })

    it('should fire events when interaction is disabled but re-enabled after', () => {
        const DynamicUpdateComponent = () => {
            const [trackInteraction, setTrackInteraction] = useState(false)

            return (
                <>
                    <div
                        data-testid="clicker"
                        onClick={() => {
                            setTrackInteraction(true)
                        }}
                    >
                        Click me
                    </div>
                    <AgridFeature flag={'test'} match={true} trackInteraction={trackInteraction}>
                        <div data-testid="helloDiv">Hello</div>
                    </AgridFeature>
                </>
            )
        }

        render(
            <AgridProvider client={agrid}>
                <DynamicUpdateComponent />
            </AgridProvider>
        )

        fireEvent.click(screen.getByTestId('helloDiv'))
        expect(agrid.capture).not.toHaveBeenCalled()

        fireEvent.click(screen.getByTestId('clicker'))
        fireEvent.click(screen.getByTestId('helloDiv'))
        fireEvent.click(screen.getByTestId('helloDiv'))
        expect(agrid.capture).toHaveBeenCalledWith('$feature_interaction', {
            feature_flag: 'test',
            $set: { '$feature_interaction/test': true },
        })
        expect(agrid.capture).toHaveBeenCalledTimes(1)
    })

    it('should not show the feature component if the flag is not enabled', () => {
        renderWith(agrid, 'test_value')

        expect(screen.queryByTestId('helloDiv')).not.toBeInTheDocument()
        expect(agrid.capture).not.toHaveBeenCalled()

        const allTags = screen.queryAllByText(/.*/)

        expect(allTags.length).toEqual(2)
        expect(allTags[0].tagName).toEqual('BODY')
        expect(allTags[1].tagName).toEqual('DIV')
    })

    it('should fallback when provided', () => {
        render(
            <AgridProvider client={agrid}>
                <AgridFeature flag={'test_false'} match={true} fallback={<div data-testid="nope">Nope</div>}>
                    <div data-testid="helloDiv">Hello</div>
                </AgridFeature>
            </AgridProvider>
        )

        expect(screen.queryByTestId('helloDiv')).not.toBeInTheDocument()
        expect(agrid.capture).not.toHaveBeenCalled()

        fireEvent.click(screen.getByTestId('nope'))
        expect(agrid.capture).not.toHaveBeenCalled()
    })

    it('should handle showing multivariate flags with bool match', () => {
        renderWith(agrid, 'multivariate_feature')

        expect(screen.queryByTestId('helloDiv')).not.toBeInTheDocument()
        expect(agrid.capture).not.toHaveBeenCalled()
    })

    it('should handle showing multivariate flags with incorrect match', () => {
        renderWith(agrid, 'multivariate_feature', 'string-valueCXCC')

        expect(screen.queryByTestId('helloDiv')).not.toBeInTheDocument()
        expect(agrid.capture).not.toHaveBeenCalled()
    })

    it('should handle showing multivariate flags', () => {
        renderWith(agrid, 'multivariate_feature', 'string-value')

        expect(screen.queryByTestId('helloDiv')).toBeInTheDocument()
        expect(agrid.capture).not.toHaveBeenCalled()

        fireEvent.click(screen.getByTestId('helloDiv'))
        expect(agrid.capture).toHaveBeenCalledWith('$feature_interaction', {
            feature_flag: 'multivariate_feature',
            feature_flag_variant: 'string-value',
            $set: { '$feature_interaction/multivariate_feature': 'string-value' },
        })
        expect(agrid.capture).toHaveBeenCalledTimes(1)
    })

    it('should handle payload flags', () => {
        render(
            <AgridProvider client={agrid}>
                <AgridFeature flag={'example_feature_payload'} match={'test'}>
                    {(payload: any) => {
                        return <div data-testid={`hi_${payload.name}`}>Hullo</div>
                    }}
                </AgridFeature>
            </AgridProvider>
        )

        expect(screen.queryByTestId('hi_example_feature_1_payload')).toBeInTheDocument()
        expect(agrid.capture).not.toHaveBeenCalled()

        fireEvent.click(screen.getByTestId('hi_example_feature_1_payload'))
        expect(agrid.capture).toHaveBeenCalledTimes(1)
    })
})
