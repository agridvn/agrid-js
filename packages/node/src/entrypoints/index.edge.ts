export * from '../exports'

import ErrorTracking from '../extensions/error-tracking'
import { AgridBackendClient } from '../client'
import { ErrorTracking as CoreErrorTracking } from '@agrid/core'

ErrorTracking.errorPropertiesBuilder = new CoreErrorTracking.ErrorPropertiesBuilder(
  [
    new CoreErrorTracking.EventCoercer(),
    new CoreErrorTracking.ErrorCoercer(),
    new CoreErrorTracking.ObjectCoercer(),
    new CoreErrorTracking.StringCoercer(),
    new CoreErrorTracking.PrimitiveCoercer(),
  ],
  [CoreErrorTracking.nodeStackLineParser]
)

export class Agrid extends AgridBackendClient {
  getLibraryId(): string {
    return 'agrid-edge'
  }
}
