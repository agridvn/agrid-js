import { defineNuxtModule, addPlugin, createResolver, addServerPlugin } from '@nuxt/kit'
import type { AgridConfig } from 'agrid-js'
import type { AgridOptions } from 'agrid-node'
import { resolveBinaryPath, spawnLocal } from '@agrid/core/process'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const filename = fileURLToPath(import.meta.url)
const resolvedDirname = dirname(filename)

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface SourcemapsConfig {
  enabled: boolean
  personalApiKey: string
  envId: string
  version?: string
  project?: string
  logLevel?: LogLevel
  deleteAfterUpload?: boolean
}

export interface ModuleOptions {
  host: string
  publicKey: string
  debug?: boolean
  cliBinaryPath?: string
  clientConfig?: AgridClientConfig
  serverConfig?: AgridServerConfig
  sourcemaps: SourcemapsConfig | undefined
}

export interface AgridCommon {
  publicKey: string
  host: string
  debug?: boolean
}

export type AgridServerConfig = AgridOptions
export type AgridClientConfig = Partial<AgridConfig>

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@agrid/nuxt',
    configKey: 'agridConfig',
    compatibility: {
      nuxt: '>=3.7.0',
    },
  },
  defaults: () => ({
    host: 'https://app.agrid.vn',
    debug: false,
    clientConfig: {},
    serverConfig: {},
  }),

  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)
    addPlugin(resolver.resolve('./runtime/vue-plugin'))
    addServerPlugin(resolver.resolve('./runtime/nitro-plugin'))

    Object.assign(nuxt.options.runtimeConfig.public, {
      agrid: {
        publicKey: options.publicKey,
        host: options.host,
        debug: options.debug,
      },
      agridClientConfig: options.clientConfig,
    })

    Object.assign(nuxt.options.runtimeConfig, {
      agridServerConfig: options.serverConfig,
    })

    if (!options.sourcemaps?.enabled || nuxt.options.dev) {
      return
    }

    const sourcemapsConfig = options.sourcemaps
    let outputDir: string | undefined
    let publicDir: string | undefined
    let serverDir: string | undefined

    nuxt.hook('nitro:init', (nitro) => {
      publicDir = nitro.options.output?.publicDir
      serverDir = nitro.options.output?.serverDir
      outputDir = nitro.options.output?.dir
    })

    nuxt.hook('nitro:config', (nitroConfig) => {
      nitroConfig.rollupConfig = {
        ...(nitroConfig.rollupConfig || {}),
        output: {
          ...(nitroConfig.rollupConfig?.output || {}),
          sourcemapExcludeSources: false, // Make sure to set it (otherwise server sourcemaps will not be generated)
        },
      }
    })

    nuxt.hook('build:before', () => {
      nuxt.options.sourcemap = {
        client: 'hidden',
        server: 'hidden',
      }
    })

    let isBuildProcess = false

    const agridCliRunner = () => {
      const cliBinaryPath =
        options.cliBinaryPath ||
        resolveBinaryPath('agrid-cli', {
          path: process.env.PATH ?? '',
          cwd: resolvedDirname,
        })
      const logLevel = sourcemapsConfig.logLevel || 'info'
      const cliEnv = {
        ...process.env,
        RUST_LOG: `agrid_cli=${logLevel}`,
        AGRID_CLI_HOST: options.host,
        AGRID_CLI_ENV_ID: sourcemapsConfig.envId,
        AGRID_CLI_TOKEN: sourcemapsConfig.personalApiKey,
      }
      return (args: string[]) => {
        return spawnLocal(cliBinaryPath, args, {
          env: cliEnv,
          cwd: process.cwd(),
          stdio: 'inherit',
        })
      }
    }

    const cliRunner = agridCliRunner()

    nuxt.hook('nitro:build:public-assets', async () => {
      isBuildProcess = true
      if (!publicDir) return
      try {
        // Inject public sourcemaps
        // This cannot be done in the close hook.
        await cliRunner(getInjectArgs(publicDir, sourcemapsConfig))
      } catch (error) {
        console.error('Failed to process public sourcemaps:', error)
      }
    })

    nuxt.hook('close', async () => {
      // We don't want to run this process during prepare and friends
      if (!isBuildProcess || !serverDir || !outputDir) return
      try {
        // Inject server sourcemaps
        await cliRunner(getInjectArgs(serverDir, sourcemapsConfig))
        // Upload all assets
        await cliRunner(getUploadArgs(outputDir, sourcemapsConfig))
      } catch (error) {
        console.error('Failed to process server sourcemaps:', error)
      }
    })
  },
}) as import('@nuxt/schema').NuxtModule<ModuleOptions>

function getInjectArgs(directory: string, sourcemapsConfig: SourcemapsConfig) {
  const processOptions: string[] = ['sourcemap', 'inject', '--ignore', '**/node_modules/**', '--directory', directory]

  if (sourcemapsConfig.project) {
    processOptions.push('--project', sourcemapsConfig.project)
  }

  if (sourcemapsConfig.version) {
    processOptions.push('--version', sourcemapsConfig.version)
  }

  return processOptions
}

function getUploadArgs(directory: string, sourcemapsConfig: SourcemapsConfig) {
  const processOptions: string[] = ['sourcemap', 'upload', '--ignore', '**/node_modules/**', '--directory', directory]

  if (sourcemapsConfig.deleteAfterUpload ?? true) {
    processOptions.push('--delete-after')
  }

  return processOptions
}
