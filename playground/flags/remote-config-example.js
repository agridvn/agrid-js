#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef, no-console */
/**
 * Simple test script for Agrid remote config endpoint.
 *
 * Usage:
 *   AGRID_API_KEY=phc_... node remote-config-example.js
 */

const { Agrid } = require('../../packages/node/lib/node')

const apiKey = process.env.AGRID_API_KEY || 'agr_test_key'
const host = process.env.AGRID_HOST || 'https://app.agrid.vn'

// Initialize Agrid client
const agrid = new Agrid(apiKey, {
    host,
    flushAt: 1,
    flushInterval: 0,
})

const distinctId = 'user-123'
const flagKey = 'my-remote-config'

async function run() {
    try {
        console.log(`Fetching remote config for flag: ${flagKey}`)
        const payload = await agrid.getRemoteConfigPayload(flagKey)
        console.log('Remote config payload:', payload)
    } catch (e) {
        console.error('Error fetching remote config:', e)
    } finally {
        await agrid.shutdown()
    }
}

run()
