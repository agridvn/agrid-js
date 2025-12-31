# Agrid JS Lite (Web)

Reduced-feature browser SDK focused on small bundle size. Supports analytics and feature flags. Use `agrid-js` for full capabilities including session recording, heatmaps, and surveys.

## Installation

```bash
npm i -s agrid-js-lite
# or
yarn add agrid-js-lite
```

It is entirely written in Typescript and has a minimal API as follows:

```ts
import Agrid from 'agrid-js-lite'

const agrid = new Agrid('YOUR_PROJECT_API_KEY', {
  // host: 'YOUR_INGESTION_URL'
})

// Capture generic events
agrid.capture('my-event', { myProperty: 'foo' })

// Identify a user (e.g. on login)
agrid.identify('my-unique-user-id', { email: 'user@example.com', name: 'Jane Doe' })
// ...or with Set Once additional properties
agrid.identify('my-unique-user-id', { $set: { email: 'example@agrid.com', name: 'Jane Doe' }, $set_once: { vip: true } })

// Reset a user (e.g. on logout)
agrid.reset()

// Register properties to be sent with all subsequent events
agrid.register({ itemsInBasket: 3 })
// ...or get rid of them if you don't want them anymore
agrid.unregister('itemsInBasket')

// Add the user to a group
agrid.group('organisations', 'org-1')
// ...or multiple groups at once
agrid.group({ organisations: 'org-1', project: 'project-1' })

// Simple feature flags
if (agrid.isFeatureEnabled('my-feature-flag')) {
  renderFlaggedFunctionality()
} else {
  renderDefaultFunctionality()
}

// Multivariate feature flags
if (agrid.getFeatureFlag('my-feature-flag-with-variants') === 'variant1') {
  renderVariant1()
} else if (agrid.getFeatureFlag('my-feature-flag-with-variants') === 'variant2') {
  renderVariant1()
} else if (agrid.getFeatureFlag('my-feature-flag-with-variants') === 'control') {
  renderControl()
}

// Override a feature flag for a specific user (e.g. for testing or user preference)
agrid.overrideFeatureFlag('my-feature-flag', true)

// Listen reactively to feature flag changes
agrid.onFeatureFlag('my-feature-flag', (value) => {
  respondToFeatureFlagChange(value)
})

// Opt users in or out, persisting across sessions (default is they are opted in)
agrid.optOut() // Will stop tracking
agrid.optIn() // Will start tracking
```

## History API Navigation Tracking

Single-page applications (SPAs) typically use the History API (`pushState`, `replaceState`) for navigation instead of full page loads. By default, Agrid only tracks the initial page load.

To automatically track navigation events in SPAs, enable the `captureHistoryEvents` option:

```ts
const agrid = new Agrid('my-api-key', {
  captureHistoryEvents: true
})
```

When enabled, Agrid will:
- Track calls to `history.pushState()` and `history.replaceState()`
- Track `popstate` events (browser back/forward navigation)
- Send these as `$pageview` events with the current URL and pathname
- Include the navigation type (`pushState`, `replaceState`, or `popstate`) as a property

This ensures accurate page tracking in modern web applications without requiring manual pageview capture calls.
