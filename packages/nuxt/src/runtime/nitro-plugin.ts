import { Agrid } from 'agrid-node'
import { uuidv7 } from '@agrid/core/vendor/uuidv7'
import { defineNitroPlugin } from 'nitropack/runtime'
import { useRuntimeConfig } from '#imports'
import type { AgridCommon, AgridServerConfig } from '../module'
import type { JsonType } from '@agrid/core'

export default defineNitroPlugin((nitroApp) => {
  const runtimeConfig = useRuntimeConfig()
  const agridCommon = runtimeConfig.public.agrid as AgridCommon
  const agridServerConfig = runtimeConfig.agridServerConfig as AgridServerConfig
  const debug = agridCommon.debug as boolean

  const client = new Agrid(agridCommon.publicKey, {
    host: agridCommon.host,
    ...agridServerConfig,
  })

  if (debug) {
    client.debug(true)
  }

  if (agridServerConfig.enableExceptionAutocapture) {
    nitroApp.hooks.hook('error', (error, { event }) => {
      const props: JsonType = {
        $process_person_profile: false,
      }
      if (event?.path) {
        props.path = event.path
      }
      if (event?.method) {
        props.method = event.method
      }

      client.captureException(error, uuidv7(), props)
    })
  }

  nitroApp.hooks.hook('close', async () => {
    await client.shutdown()
  })
})
