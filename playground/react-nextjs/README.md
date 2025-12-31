# Agrid React Playground

This is a playground for testing the Agrid React SDK (`@agrid/react`) in a Next.js App Router environment.

## Features

- **Event Display**: Real-time display of Agrid events in the top-right corner
- **Feature Flags**: Testing feature flags and overrides
- **Identify/Reset**: Testing user identification and reset

## Setup

1. Copy `.env.local.example` to `.env.local`
2. Set your Agrid API key and host
3. Run `pnpm install`
4. Run `pnpm dev`

## How it works

- The `AgridProvider` is initialized in `app/providers.tsx`
- The `EventDisplay` component intercepts Agrid events and displays them in real-time
- Pages demonstrate usage of `useAgrid`, `useFeatureFlagEnabled`, etc.
