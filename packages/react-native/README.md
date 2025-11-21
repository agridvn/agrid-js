# Agrid React Native (unscoped)

React Native SDK for Agrid analytics and feature flags. This package provides `PostHogProvider` and hooks for RN apps.

## Installation

```bash
npm install agrid-react-native
# or
yarn add agrid-react-native
# or
pnpm add agrid-react-native
```

## Quick Start

```tsx
import { PostHogProvider } from 'agrid-react-native'

export function App() {
  return (
    <PostHogProvider
      apiKey="YOUR_PROJECT_API_KEY"
      options={{ host: 'https://app.agrid.com' }}
    >
      <YourApp />
    </PostHogProvider>
  )
}
```

### Hooks

- `usePostHog()` to access the client
- `useFeatureFlagEnabled(flag)` to check flags

## Links

- Main repo: https://github.com/advnsoftware-oss/agrid-js
