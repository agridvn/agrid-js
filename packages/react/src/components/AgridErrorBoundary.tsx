import React, { FunctionComponent } from 'react'
import { AgridContext } from '../context'
import { isFunction } from '../utils/type-utils'

export type Properties = Record<string, any>

export type AgridErrorBoundaryFallbackProps = {
    error: unknown
    exceptionEvent: unknown
    componentStack: string
}

export type AgridErrorBoundaryProps = {
    children?: React.ReactNode | (() => React.ReactNode)
    fallback?: React.ReactNode | FunctionComponent<AgridErrorBoundaryFallbackProps>
    additionalProperties?: Properties | ((error: unknown) => Properties)
}

type AgridErrorBoundaryState = {
    componentStack: string | null
    exceptionEvent: unknown
    error: unknown
}

const INITIAL_STATE: AgridErrorBoundaryState = {
    componentStack: null,
    exceptionEvent: null,
    error: null,
}

export const __AGRID_ERROR_MESSAGES = {
    INVALID_FALLBACK:
        '[Agrid.js][AgridErrorBoundary] Invalid fallback prop, provide a valid React element or a function that returns a valid React element.',
}

export class AgridErrorBoundary extends React.Component<AgridErrorBoundaryProps, AgridErrorBoundaryState> {
    static contextType = AgridContext

    constructor(props: AgridErrorBoundaryProps) {
        super(props)
        this.state = INITIAL_STATE
    }

    componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
        //eslint-disable-next-line react/prop-types
        const { additionalProperties } = this.props
        let currentProperties
        if (isFunction(additionalProperties)) {
            currentProperties = additionalProperties(error)
        } else if (typeof additionalProperties === 'object') {
            currentProperties = additionalProperties
        }
        const { client } = this.context
        const exceptionEvent = client.captureException(error, currentProperties)

        const { componentStack } = errorInfo
        this.setState({
            error,
            componentStack,
            exceptionEvent,
        })
    }

    public render(): React.ReactNode {
        //eslint-disable-next-line react/prop-types
        const { children, fallback } = this.props
        const state = this.state

        if (state.componentStack == null) {
            return isFunction(children) ? children() : children
        }

        const element = isFunction(fallback)
            ? (React.createElement(fallback, {
                  error: state.error,
                  componentStack: state.componentStack,
                  exceptionEvent: state.exceptionEvent,
              }) as React.ReactNode)
            : fallback

        if (React.isValidElement(element)) {
            return element as React.ReactElement
        }
        // eslint-disable-next-line no-console
        console.warn(__AGRID_ERROR_MESSAGES.INVALID_FALLBACK)
        return <></>
    }
}
