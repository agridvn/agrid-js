/* eslint-disable no-console */

import express from 'express'
import { Agrid, setupExpressErrorHandler } from 'agrid-node'
// import undici from 'undici'

const app = express()

const {
    AGRID_PROJECT_API_KEY = 'YOUR API KEY',
    AGRID_HOST = 'http://127.0.0.1:8000',
    AGRID_PERSONAL_API_KEY = 'YOUR PERSONAL API KEY',
} = process.env

const agrid = new Agrid(AGRID_PROJECT_API_KEY, {
    host: AGRID_HOST,
    flushAt: 10,
    personalApiKey: AGRID_PERSONAL_API_KEY,
    // By default Agrid uses node fetch but you can specify your own implementation if preferred
    // fetch(url, options) {
    //   console.log(url, options)
    //   return undici.fetch(url, options)
    // },
})

console.log('LOCAL EVALUATION READY RIGHT AFTER CREATION: ', agrid.isLocalEvaluationReady())

agrid.on('localEvaluationFlagsLoaded', (count: number) => {
    console.log('LOCAL EVALUATION READY (localEvaluationFlagsLoaded) EVENT EMITTED: flags count: ', count)
})

agrid.debug()

setupExpressErrorHandler(agrid, app)

app.get('/', (req, res) => {
    agrid.capture({ distinctId: 'EXAMPLE_APP_GLOBAL', event: 'legacy capture' })
    res.send({ hello: 'world' })
})

app.get('/unhandled-error', () => {
    throw new Error('unhandled error')
})

app.get('/error', (req, res) => {
    const error = new Error('example error')
    agrid.captureException(error, 'EXAMPLE_APP_GLOBAL')
    res.send({ status: 'error!!' })
})

app.get('/wait-for-local-evaluation-ready', async (req, res) => {
    const FIVE_SECONDS = 5000
    const ready = await agrid.waitForLocalEvaluationReady(FIVE_SECONDS)
    res.send({ ready })
})

app.get('/user/:userId/action', (req, res) => {
    agrid.capture({ distinctId: req.params.userId, event: 'user did action', properties: req.params })

    res.send({ status: 'ok' })
})

app.get('/user/:userId/flags/:flagId', async (req, res) => {
    const flag = await agrid.getFeatureFlag(req.params.flagId, req.params.userId).catch((e) => console.error(e))
    const payload = await agrid
        .getFeatureFlagPayload(req.params.flagId, req.params.userId)
        .catch((e) => console.error(e))
    res.send({ [req.params.flagId]: { flag, payload } })
})

app.get('/user/:userId/flags', async (req, res) => {
    const allFlags = await agrid.getAllFlagsAndPayloads(req.params.userId).catch((e) => console.error(e))
    res.send(allFlags)
})

const server = app.listen(8020, () => {
    console.log('⚡: Server is running at http://localhost:8020')
})

async function handleExit(signal: any) {
    console.log(`Received ${signal}. Flushing...`)
    await agrid.shutdown()
    console.log(`Flush complete`)
    server.close(() => {
        process.exit(0)
    })
}
process.on('SIGINT', handleExit)
process.on('SIGQUIT', handleExit)
process.on('SIGTERM', handleExit)
