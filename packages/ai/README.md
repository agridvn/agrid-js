# Agrid Node AI

TypeScript SDK for LLM observability and analytics. Integrates OpenAI, Anthropic, Gemini, LangChain, and Vercel AI SDK with Agrid.

## Installation

```bash
npm install @agrid/ai
```

## Usage

```ts
import { OpenAI } from '@agrid/ai'
import { PostHog } from 'agrid-node'

const agrid = new PostHog('YOUR_PROJECT_API_KEY', { host: 'https://app.agrid.com' })

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  posthog: agrid,
})

const completion = await client.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'Tell me a fun fact about hedgehogs' }],
  posthogDistinctId: 'user_123',
  posthogTraceId: 'trace_123',
  posthogProperties: { conversation_id: 'abc123', paid: true },
  posthogGroups: { company: 'company_42' },
})

console.log(completion.choices[0].message.content)

await agrid.shutdown()
```

## Links

- Main repo: https://github.com/agridvn/agrid-js
- npm: https://www.npmjs.com/package/@agrid/ai
