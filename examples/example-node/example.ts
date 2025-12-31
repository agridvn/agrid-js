// Agrid Node.js library example
// This script demonstrates various Agrid Node.js SDK capabilities including:
// - Basic event capture and user identification
// - Feature flag local evaluation
// - Feature flag payloads
// - Flag dependencies evaluation
//
// Setup:
// 1. Copy .env.example to .env and fill in your Agrid credentials
// 2. Run this script and choose from the interactive menu

/* eslint-disable no-console */

// eslint-disable-next-line @typescript-eslint/no-require-imports
import { Agrid } from 'agrid-node'

// Helper function to satisfy ESLint rule
const isUndefined = (x: unknown): x is undefined => x === void 0
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { createInterface as createReadlineInterface } from 'readline'
import wtf from 'wtfnode'

function loadEnvFile(): void {
    /**
     * Load environment variables from .env file if it exists.
     * This matches the behavior of the Agrid Python SDK example.
     */
    const envPath = join(__dirname, '.env')
    if (existsSync(envPath)) {
        const envFile = readFileSync(envPath, 'utf8')
        for (const line of envFile.split('\n')) {
            const trimmedLine = line.trim()
            if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes('=')) {
                const [key, ...valueParts] = trimmedLine.split('=')
                const value = valueParts.join('=')
                if (key && value && !process.env[key.trim()]) {
                    process.env[key.trim()] = value.trim()
                }
            }
        }
    }
}

// Load .env file if it exists
loadEnvFile()

const {
    AGRID_PROJECT_API_KEY = process.env.AGRID_PROJECT_API_KEY || '',
    AGRID_HOST = process.env.AGRID_HOST || 'https://app.agrid.vn',
    AGRID_PERSONAL_API_KEY = process.env.AGRID_PERSONAL_API_KEY || '',
} = process.env

// Check if credentials are provided
if (!AGRID_PROJECT_API_KEY || !AGRID_PERSONAL_API_KEY) {
    console.log('❌ Missing Agrid credentials!')
    console.log('   Please set AGRID_PROJECT_API_KEY and AGRID_PERSONAL_API_KEY environment variables')
    console.log('   or copy .env.example to .env and fill in your values')
    process.exit(1)
}

const agrid = new Agrid(AGRID_PROJECT_API_KEY, {
    host: AGRID_HOST,
    personalApiKey: AGRID_PERSONAL_API_KEY,
    featureFlagsPollingInterval: 10000,
})

// Enable debug mode to see what's happening with flag evaluation
// agrid.debug(true)  // Disabled to reduce noise

async function testAuthentication(): Promise<void> {
    // Test authentication before proceeding
    console.log('🔑 Testing Agrid authentication...')

    try {
        const isReady = await agrid.waitForLocalEvaluationReady(15000)
        if (isReady) {
            console.log('✅ Authentication successful!')
            console.log('✅ Local evaluation ready - flags can be evaluated locally')
            console.log(`   Project API Key: ${AGRID_PROJECT_API_KEY.substring(0, 9)}...`)
            console.log('   Personal API Key: [REDACTED]')
            console.log(`   Host: ${AGRID_HOST}\n`)
        } else {
            console.log('⚠️  Local evaluation not ready within 15 seconds')
            console.log('   This might indicate credential issues or network problems')
            console.log('   Flag evaluations may return undefined or fall back to API calls')
            console.log('   Continuing with examples...\n')
        }
    } catch (error) {
        console.log('❌ Authentication test failed!')
        console.log(`   Error: ${error}`)
        console.log('\n   Please check your credentials:')
        console.log('   - AGRID_PROJECT_API_KEY: Project API key from Agrid settings')
        console.log('   - AGRID_PERSONAL_API_KEY: Personal API key (required for local evaluation)')
        console.log('   - AGRID_HOST: Your Agrid instance URL')
        process.exit(1)
    }
}

async function identifyAndCaptureExamples(): Promise<void> {
    console.log('\n' + '='.repeat(60))
    console.log('IDENTIFY AND CAPTURE EXAMPLES')
    console.log('='.repeat(60))

    // Capture basic events
    console.log('📊 Capturing events...')
    agrid.capture({
        distinctId: 'demo_user',
        event: 'demo_event',
        properties: { property1: 'value', property2: 'value' },
        sendFeatureFlags: true,
    })

    // Capture with groups
    agrid.capture({
        distinctId: 'demo_user',
        event: 'demo_event_with_groups',
        properties: { property1: 'value', property2: 'value' },
        groups: { company: 'id:5' },
    })

    // Identify user
    console.log('👤 Identifying user...')
    agrid.identify({
        distinctId: 'demo_user',
        properties: { email: 'demo@example.com', plan: 'premium' },
    })

    // Group identify
    console.log('🏢 Identifying group...')
    agrid.groupIdentify({
        groupType: 'company',
        groupKey: 'id:5',
        properties: { employees: 11, tier: 'enterprise' },
    })

    // Alias
    console.log('🔗 Creating alias...')
    agrid.alias({
        distinctId: 'demo_user',
        alias: 'new_demo_user',
    })

    console.log('✅ Identity and capture examples completed!')
}

async function featureFlagExamples(): Promise<void> {
    console.log('\n' + '='.repeat(60))
    console.log('FEATURE FLAG LOCAL EVALUATION EXAMPLES')
    console.log('='.repeat(60))

    console.log('🏁 Testing basic feature flags...')

    const basicFlag1 = await agrid.isFeatureEnabled('beta-feature', 'demo_user')
    console.log(`beta-feature for 'demo_user': ${basicFlag1}`)

    const basicFlag2 = await agrid.isFeatureEnabled('beta-feature', 'other_user')
    console.log(`beta-feature for 'other_user': ${basicFlag2}`)

    const groupFlag = await agrid.isFeatureEnabled('beta-feature-groups', 'demo_user', {
        groups: { company: 'id:5' },
    })
    console.log(`beta-feature with groups: ${groupFlag}`)

    console.log('\n🌍 Testing location-based flags...')
    const sydneyFlag = await agrid.isFeatureEnabled('test-flag', 'random_id_12345', {
        personProperties: { $geoip_city_name: 'Sydney' },
    })
    console.log(`Sydney user: ${sydneyFlag}`)

    const sydneyFlagLocal = await agrid.isFeatureEnabled('test-flag', 'distinct_id_random_22', {
        personProperties: { $geoip_city_name: 'Sydney' },
        onlyEvaluateLocally: true,
    })
    console.log(`Sydney user (local only): ${sydneyFlagLocal}`)

    console.log('\n📋 Getting all flags...')
    const allFlags = await agrid.getAllFlags('distinct_id_random_22')
    console.log(`All flags count: ${Object.keys(allFlags).length}`)

    const allFlagsLocal = await agrid.getAllFlags('distinct_id_random_22', { onlyEvaluateLocally: true })
    console.log(`All flags (local) count: ${Object.keys(allFlagsLocal).length}`)

    const allFlagsWithProps = await agrid.getAllFlags('distinct_id_random_22', {
        personProperties: { $geoip_city_name: 'Sydney' },
        onlyEvaluateLocally: true,
    })
    console.log(`All flags with properties count: ${Object.keys(allFlagsWithProps).length}`)

    console.log('✅ Feature flag examples completed!')
}

async function payloadExamples(): Promise<void> {
    console.log('\n' + '='.repeat(60))
    console.log('FEATURE FLAG PAYLOAD EXAMPLES')
    console.log('='.repeat(60))

    console.log('📦 Testing feature flag payloads...')

    try {
        const payload = await agrid.getFeatureFlagPayload('beta-feature', 'demo_user')
        console.log(`beta-feature payload: ${JSON.stringify(payload)}`)
    } catch (error) {
        console.log(`beta-feature payload: Error - ${error}`)
    }

    try {
        const allPayloads = await agrid.getAllFlagsAndPayloads('demo_user')
        console.log(`All flags and payloads count: ${Object.keys(allPayloads).length}`)
    } catch (error) {
        console.log(`All payloads: Error - ${error}`)
    }

    try {
        const remoteConfig = await agrid.getRemoteConfigPayload('encrypted_payload_flag_key')
        console.log(`Remote config payload: ${JSON.stringify(remoteConfig)}`)
    } catch (error) {
        console.log(`Remote config payload: Error - ${error}`)
    }

    console.log('✅ Payload examples completed!')
}

async function flagDependenciesExamples(): Promise<void> {
    console.log('\n' + '='.repeat(60))
    console.log('FLAG DEPENDENCIES EXAMPLES')
    console.log('='.repeat(60))
    console.log('🔗 Testing flag dependencies with local evaluation...')
    console.log('   Flag structure: "test-flag-dependency" depends on "beta-feature" being enabled')
    console.log('')
    console.log("📋 Required setup (if flags don't exist in your Agrid instance):")
    console.log('   1. Create feature flag "beta-feature":')
    console.log('      - Condition: email contains "@example.com"')
    console.log('      - Rollout: 100%')
    console.log('   2. Create feature flag "test-flag-dependency":')
    console.log('      - Condition: flag "beta-feature" is enabled')
    console.log('      - Rollout: 100%')
    console.log('')

    // Check if local evaluation is ready before testing
    const isLocallyReady = await agrid.waitForLocalEvaluationReady(1000) // Quick check
    console.log(`🔍 Local evaluation ready: ${isLocallyReady ? '✅ YES' : '❌ NO'}`)

    if (!isLocallyReady) {
        console.log('⚠️  Warning: Local evaluation not ready - results may be undefined or use API calls')
    }

    // Check what flags are available locally (with proper person properties)
    console.log('\n🏁 Checking available flags for local evaluation...')
    const allLocalFlags = await agrid.getAllFlags('test_user', {
        onlyEvaluateLocally: true,
        personProperties: { email: 'user@example.com' },
    })
    console.log(`   Available flags: ${Object.keys(allLocalFlags).length} total`)
    console.log(`   Key flags for testing:`)
    if (!isUndefined(allLocalFlags['beta-feature'])) {
        console.log(`     beta-feature: ${allLocalFlags['beta-feature']}`)
    } else {
        console.log(`     beta-feature: undefined (not evaluatable)`)
    }
    if (!isUndefined(allLocalFlags['test-flag-dependency'])) {
        console.log(`     test-flag-dependency: ${allLocalFlags['test-flag-dependency']}`)
    } else {
        console.log(`     test-flag-dependency: undefined (not evaluatable)`)
    }

    // Check if test-flag-dependency contains properties with type="flag"
    console.log('\n🔍 Debugging test-flag-dependency structure...')
    try {
        const directResult = await agrid.isFeatureEnabled('test-flag-dependency', 'debug_user', {
            personProperties: { email: 'user@example.com' },
            onlyEvaluateLocally: true,
        })
        console.log(`   Direct isFeatureEnabled call result: ${directResult} (${typeof directResult})`)
    } catch (error) {
        console.log(`   Direct isFeatureEnabled call error: ${error}`)
    }

    console.log('\n🧪 Testing flag evaluations...')

    // First let's confirm beta-feature works locally (this is our dependency flag)
    console.log('   Step 1: Testing beta-feature (dependency flag)...')
    const betaResult1 = await agrid.isFeatureEnabled('beta-feature', 'example_user', {
        personProperties: { email: 'user@example.com' },
        onlyEvaluateLocally: true,
    })
    const betaResult2 = await agrid.isFeatureEnabled('beta-feature', 'regular_user', {
        personProperties: { email: 'user@other.com' },
        onlyEvaluateLocally: true,
    })
    console.log(`     @example.com user: ${betaResult1} (${typeof betaResult1})`)
    console.log(`     Regular user: ${betaResult2} (${typeof betaResult2})`)
    console.log(
        `     ✅ Beta-feature local evaluation: ${betaResult1 === true && betaResult2 === false ? 'WORKING' : 'BROKEN'}`
    )

    // Now test the dependent flag
    console.log('   Step 2: Testing test-flag-dependency (dependent flag)...')
    const dependentResult1 = await agrid.isFeatureEnabled('test-flag-dependency', 'example_user', {
        personProperties: { email: 'user@example.com' },
        onlyEvaluateLocally: true,
    })
    const dependentResult2 = await agrid.isFeatureEnabled('test-flag-dependency', 'regular_user', {
        personProperties: { email: 'user@other.com' },
        onlyEvaluateLocally: true,
    })
    console.log(`     @example.com user: ${dependentResult1} (${typeof dependentResult1})`)
    console.log(`     Regular user: ${dependentResult2} (${typeof dependentResult2})`)

    const dependentResult3 = await agrid.getFeatureFlag('multivariate-root-flag', 'regular_user', {
        personProperties: { email: 'pineapple@example.com' },
        onlyEvaluateLocally: true,
    })
    if (dependentResult3 !== 'breaking-bad') {
        console.log(
            `     ❌ Something went wrong evaluating 'multivariate-root-flag' with pineapple@example.com. Expected 'breaking-bad', got '${dependentResult3}'`
        )
    } else {
        console.log("✅ 'multivariate-root-flag' with email pineapple@example.com succeeded")
    }

    const dependentResult4 = await agrid.getFeatureFlag('multivariate-root-flag', 'regular_user', {
        personProperties: { email: 'mango@example.com' },
        onlyEvaluateLocally: true,
    })
    if (dependentResult4 !== 'the-wire') {
        console.log(
            `     ❌ Something went wrong evaluating multivariate-root-flag with mango@example.com. Expected 'the-wire', got '${dependentResult4}'`
        )
    } else {
        console.log("✅ 'multivariate-root-flag' with email mango@example.com succeeded")
    }

    // Diagnosis
    if (isUndefined(dependentResult1) || isUndefined(dependentResult2)) {
        console.log(`   ❌ Flag dependency local evaluation: NOT WORKING (returns undefined)`)
        console.log(`   💡 This suggests flag dependencies may not be supported in local evaluation yet`)
    } else {
        console.log(`   ✅ Flag dependency local evaluation: WORKING`)
    }

    console.log('\n🎯 Results Summary:')
    const hasValidResults = !isUndefined(dependentResult1) && !isUndefined(dependentResult2)
    const hasDifferentResults = dependentResult1 !== dependentResult2
    const betaWorksLocally = betaResult1 === true && betaResult2 === false

    console.log(`   - Local evaluation ready: ${isLocallyReady ? '✅ YES' : '❌ NO'}`)
    console.log(`   - Simple flags work locally: ${betaWorksLocally ? '✅ YES' : '❌ NO'}`)
    console.log(`   - Flag dependencies work locally: ${hasValidResults && hasDifferentResults ? '✅ YES' : '❌ NO'}`)
    console.log(`   - Node.js SDK supports flag dependencies (via API): ✅ YES`)

    if (!hasValidResults && betaWorksLocally && isLocallyReady) {
        console.log('')
        console.log('   📝 CONCLUSION: Flag dependencies are not yet supported in local evaluation')
        console.log('      for the Node.js SDK. Use API evaluation (remove onlyEvaluateLocally)')
        console.log('      if you need flag dependencies to work.')
    }

    // Demonstrate caching behavior
    console.log('\n⚡ Demonstrating evaluation caching...')
    const startTime = Date.now()

    // These calls should use cached results for faster evaluation
    for (let i = 0; i < 5; i++) {
        await agrid.getAllFlags('cache_test_user', {
            personProperties: { email: 'user@example.com' },
            onlyEvaluateLocally: true,
        })
    }

    const endTime = Date.now()
    console.log(`⏱️  5 getAllFlags calls completed in ${endTime - startTime}ms (caching active)`)

    console.log('\n✅ Flag dependencies examples completed!')
}

async function runAllExamples(): Promise<void> {
    console.log('\n🔄 Running all examples...')

    console.log(`\n${'🔸'.repeat(20)} IDENTIFY AND CAPTURE ${'🔸'.repeat(20)}`)
    console.log('📊 Capturing events...')
    agrid.capture({
        distinctId: 'all_examples_user',
        event: 'demo_event',
        properties: { property1: 'value', property2: 'value' },
        sendFeatureFlags: true,
    })
    console.log('👤 Identifying user...')
    agrid.identify({
        distinctId: 'all_examples_user',
        properties: { email: 'demo@example.com', demo_run: 'all_examples' },
    })

    console.log(`\n${'🔸'.repeat(20)} FEATURE FLAGS ${'🔸'.repeat(20)}`)
    console.log('🏁 Testing basic feature flags...')
    const betaFlag = await agrid.isFeatureEnabled('beta-feature', 'all_examples_user')
    console.log(`beta-feature: ${betaFlag}`)
    const sydneyFlag = await agrid.isFeatureEnabled('test-flag', 'all_examples_user', {
        personProperties: { $geoip_city_name: 'Sydney' },
    })
    console.log(`Sydney user: ${sydneyFlag}`)

    console.log(`\n${'🔸'.repeat(20)} PAYLOADS ${'🔸'.repeat(20)}`)
    console.log('📦 Testing payloads...')
    try {
        const payload = await agrid.getFeatureFlagPayload('beta-feature', 'all_examples_user')
        console.log(`Payload: ${JSON.stringify(payload)}`)
    } catch (error) {
        console.log(`Payload: Error - ${error}`)
    }

    console.log(`\n${'🔸'.repeat(20)} FLAG DEPENDENCIES ${'🔸'.repeat(20)}`)
    console.log('🔗 Testing flag dependencies...')
    const result1 = await agrid.isFeatureEnabled('test-flag-dependency', 'demo_user', {
        personProperties: { email: 'user@example.com' },
        onlyEvaluateLocally: true,
    })
    const result2 = await agrid.isFeatureEnabled('test-flag-dependency', 'demo_user2', {
        personProperties: { email: 'user@other.com' },
        onlyEvaluateLocally: true,
    })
    console.log(`✅ @example.com user: ${result1}, regular user: ${result2}`)

    console.log('\n✅ All examples completed!')
}

function createInterface() {
    return createReadlineInterface({
        input: process.stdin,
        output: process.stdout,
    })
}

function askQuestion(rl: any, question: string): Promise<string> {
    // eslint-disable-next-line compat/compat
    return new Promise((resolve) => {
        rl.question(question, (answer: string) => {
            resolve(answer.trim())
        })
    })
}

async function main(): Promise<void> {
    await testAuthentication()

    const rl = createInterface()

    console.log('🚀 Agrid Node.js SDK Demo - Choose an example to run:\n')
    console.log('1. Identify and capture examples')
    console.log('2. Feature flag local evaluation examples')
    console.log('3. Feature flag payload examples')
    console.log('4. Flag dependencies examples')
    console.log('5. Run all examples')
    console.log('6. Exit')

    const choice = await askQuestion(rl, '\nEnter your choice (1-6): ')

    switch (choice) {
        case '1':
            await identifyAndCaptureExamples()
            break
        case '2':
            await featureFlagExamples()
            break
        case '3':
            await payloadExamples()
            break
        case '4':
            await flagDependenciesExamples()
            break
        case '5':
            await runAllExamples()
            break
        case '6':
            console.log('👋 Goodbye!')
            break
        default:
            console.log('❌ Invalid choice. Please run again and select 1-6.')
            break
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ Example completed!')
    console.log('='.repeat(60))

    rl.close()
    await agrid.shutdown()
    wtf.dump()
}

main().catch((error) => {
    console.error('Error running example:', error)
    process.exit(1)
})
