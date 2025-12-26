# Agrid Next.js Config

Helper to configure and upload sourcemaps for Agrid Error Tracking in Next.js projects.

## Usage

```ts
// next.config.ts
import { withPostHogConfig } from '@agrid/nextjs-config'

const nextConfig = {
  // Your Next.js configuration
}

export default withPostHogConfig(nextConfig, {
  personalApiKey: process.env.AGRID_PERSONAL_API_KEY!,
  envId: process.env.AGRID_ENV_ID!,
  host: process.env.NEXT_PUBLIC_AGRID_HOST ?? 'https://app.agrid.com',
  sourcemaps: {
    enabled: true,
    project: 'my-application',
    version: process.env.AGRID_RELEASE_VERSION,
    deleteAfterUpload: true,
  },
})
```

## Notes

- Uses compiler or webpack hook depending on NextJS version.
- Turbopack support requires Next `>= 15.4.1`.

## Links

- Main repo: https://github.com/agridvn/agrid-js
