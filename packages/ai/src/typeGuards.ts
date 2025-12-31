// Type guards for safer type checking
/* eslint-disable agrid-js/no-direct-undefined-check, agrid-js/no-direct-null-check, agrid-js/no-direct-array-check, agrid-js/no-direct-number-check */

export const isString = (value: unknown): value is string => {
  return typeof value === 'string'
}

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return !isNull(value) && typeof value === 'object' && !isArray(value)
}

export const isUndefined = (value: unknown): value is undefined => {
  return value === undefined
}

export const isNull = (value: unknown): value is null => {
  return value === null
}

export const isArray = (value: unknown): value is unknown[] => {
  return Array.isArray(value)
}

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number'
}
