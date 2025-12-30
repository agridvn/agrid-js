# Agrid Node.js SDK

Server-side SDK for Agrid product analytics and feature flags. Use this package to capture events from backend services, workers, and serverless functions.

## Installation

```bash
npm install agrid-node
# or
yarn add agrid-node
# or
pnpm add agrid-node
```

## Quick Start

```ts
import { PostHog } from 'agrid-node'

const agrid = new PostHog('YOUR_PROJECT_API_KEY', {
  host: 'YOUR_INGESTION_URL'
})

await agrid.capture({
  distinctId: 'user_123',
  event: 'purchase_completed',
  properties: { product_id: '123', price: 99.99 }
})

await agrid.shutdown()
```

## Features

- Event capture with custom properties
- Identify users and manage groups
- Server-side feature flags and variants
- Works in Node.js `>= 20`, serverless, edge runtimes (see exports)

## Exports

- `node` entry: `dist/entrypoints/index.node.*`
- `edge`/`workerd` entries for edge runtimes

## Links

- Main repo: https://github.com/agridvn/agrid-js
- npm: https://www.npmjs.com/package/agrid-node
