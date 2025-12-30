# Agrid Nuxt Module

- Configures and uploads sourcemaps for Agrid Error Tracking
- Provides client initialization and auto exception capture for Vue and Nitro

## Installation

```bash
pnpm add @agrid/nuxt
# or
npm install @agrid/nuxt
# or
yarn add @agrid/nuxt
```

## Usage

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@agrid/nuxt'],

  sourcemap: { client: 'hidden' },

  nitro: {
    rollupConfig: { output: { sourcemapExcludeSources: false } },
  },

  agridConfig: {
    host: 'YOUR_INGESTION_URL',
    publicKey: 'YOUR_PUBLIC_KEY',
    clientConfig: {}, // partial Browser SDK config
    serverConfig: {}, // Node SDK options (error tracking only)
    sourcemaps: {
      enabled: true,
      envId: process.env.AGRID_ENV_ID!,
      project: 'my-application',
      version: process.env.AGRID_RELEASE_VERSION,
      personalApiKey: process.env.AGRID_PERSONAL_API_KEY!,
    },
  },
})
```

### Access client in Vue

```ts
const { $posthog } = useNuxtApp()
```

On the server, the initialized client is intended exclusively for error tracking. For other server-side analytics, instantiate a separate client where needed.

## Development

```bash
pnpm i
pnpm build
```

## Links

- Main repo: https://github.com/agridvn/agrid-js
