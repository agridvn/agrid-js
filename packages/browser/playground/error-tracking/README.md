# Getting started

### Requirements

```shell
# Install Agrid CLI globally
cargo install agrid-cli
```

From the project root directory:
```shell
# Install deps
pnpm install

# Build local version of agrid-js
pnpm run build-agrid
```

## Sourcemaps management

Commands to test sourcemap upload:
```shell
# Generate build artifacts and use agrid-cli to inject snippets into sources and sourcemaps
VITE_AGRID_KEY='<your-project-key>' VITE_AGRID_HOST='http://localhost:8010' pnpm run build

# For NextJS based app use
NEXT_PUBLIC_AGRID_KEY='<your-project-key>' NEXT_PUBLIC_AGRID_HOST='http://localhost:8010' pnpm run build

# Use agrid-cli to inject snippets into sources and sourcemaps
pnpm run inject

# Upload sourcemaps to Agrid
pnpm run upload

# Run application locally with newly generated minified build and sourcemaps
# Start sending exceptions to Agrid
pnpm run preview
```
