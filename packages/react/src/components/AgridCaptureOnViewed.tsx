import React, { Children, useCallback, useRef } from 'react'
import { useAgrid } from '../hooks'
import { VisibilityAndClickTracker } from './internal/VisibilityAndClickTracker'

export type AgridCaptureOnViewedProps = React.HTMLProps<HTMLDivElement> & {
    name?: string
    properties?: Record<string, any>
    observerOptions?: IntersectionObserverInit
    trackAllChildren?: boolean
}

function TrackedChild({
    child,
    index,
    name,
    properties,
    observerOptions,
}: {
    child: React.ReactNode
    index: number
    name?: string
    properties?: Record<string, any>
    observerOptions?: IntersectionObserverInit
}): JSX.Element {
    const trackedRef = useRef(false)
    const agrid = useAgrid()

    const onIntersect = useCallback(
        (entry: IntersectionObserverEntry) => {
            if (entry.isIntersecting && !trackedRef.current) {
                agrid.capture('$element_viewed', {
                    element_name: name,
                    child_index: index,
                    ...properties,
                })
                trackedRef.current = true
            }
        },
        [agrid, name, index, properties]
    )

    return (
        <VisibilityAndClickTracker onIntersect={onIntersect} trackView={true} options={observerOptions}>
            {child}
        </VisibilityAndClickTracker>
    )
}

export function AgridCaptureOnViewed({
    name,
    properties,
    observerOptions,
    trackAllChildren,
    children,
    ...props
}: AgridCaptureOnViewedProps): JSX.Element {
    const trackedRef = useRef(false)
    const agrid = useAgrid()

    const onIntersect = useCallback(
        (entry: IntersectionObserverEntry) => {
            if (entry.isIntersecting && !trackedRef.current) {
                agrid.capture('$element_viewed', {
                    element_name: name,
                    ...properties,
                })
                trackedRef.current = true
            }
        },
        [agrid, name, properties]
    )

    if (trackAllChildren) {
        const trackedChildren = Children.map(children, (child, index) => {
            return (
                <TrackedChild
                    key={index}
                    child={child}
                    index={index}
                    name={name}
                    properties={properties}
                    observerOptions={observerOptions}
                />
            )
        })

        return <div {...props}>{trackedChildren}</div>
    }

    return (
        <VisibilityAndClickTracker onIntersect={onIntersect} trackView={true} options={observerOptions} {...props}>
            {children}
        </VisibilityAndClickTracker>
    )
}
