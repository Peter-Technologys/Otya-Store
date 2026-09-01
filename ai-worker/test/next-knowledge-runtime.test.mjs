import assert from 'node:assert/strict'
import test from 'node:test'

import { withPublicNextKnowledge } from '../src/next-knowledge-runtime.mjs'

function publicMessages(question) {
  return [
    { role: 'system', content: 'You are Next, a friendly general-purpose AI assistant built into Otya. Public Next cannot see the private owner assistant, admin email, GitHub or Cloudflare.' },
    { role: 'user', content: question },
  ]
}

test('general public questions do not query Otya knowledge', async () => {
  let searches = 0
  let received
  const env = {
    AI_SEARCH: { async search() { searches += 1; return { chunks: [] } } },
    AI: { async run(_model, input) { received = input; return { response: 'ok' } } },
  }
  const runtime = withPublicNextKnowledge(env)
  await runtime.AI.run('model', { messages: publicMessages('Explain photosynthesis') })
  assert.equal(searches, 0)
  assert.equal(received.messages.length, 2)
})

test('Otya questions inject retrieved context exactly once across model fallback calls', async () => {
  let searches = 0
  const inputs = []
  const env = {
    AI_SEARCH: {
      async search() {
        searches += 1
        return { chunks: [{ text: 'Transfer works on the supported local network.' }] }
      },
    },
    AI: {
      async run(_model, input) {
        inputs.push(input)
        return { response: 'ok' }
      },
    },
  }
  const runtime = withPublicNextKnowledge(env)
  const input = { messages: publicMessages('How does Otya Transfer work?') }
  await runtime.AI.run('model-a', input)
  await runtime.AI.run('model-b', input)

  assert.equal(searches, 1)
  assert.equal(inputs.length, 2)
  for (const received of inputs) {
    assert.equal(received.messages.length, 3)
    assert.match(received.messages[1].content, /RETRIEVED OTYA KNOWLEDGE/)
    assert.match(received.messages[1].content, /Transfer works/)
    assert.equal(received.messages[2].role, 'user')
  }
})

test('owner operations prompts are never enriched with public user knowledge', async () => {
  let searches = 0
  let received
  const env = {
    AI_SEARCH: { async search() { searches += 1; return { chunks: [{ text: 'should not be used' }] } } },
    AI: { async run(_model, input) { received = input; return { response: 'ok' } } },
  }
  const runtime = withPublicNextKnowledge(env)
  const messages = [
    { role: 'system', content: 'You are the private operations analyst for Otya.' },
    { role: 'user', content: 'Summarize Otya account health.' },
  ]
  await runtime.AI.run('model', { messages })
  assert.equal(searches, 0)
  assert.deepEqual(received.messages, messages)
})

test('prompt wording alone cannot opt an owner or internal call into public retrieval', async () => {
  let searches = 0
  let received
  const env = {
    AI_SEARCH: { async search() { searches += 1; return { chunks: [{ text: 'should not be used' }] } } },
    AI: { async run(_model, input) { received = input; return { response: 'ok' } } },
  }
  const runtime = withPublicNextKnowledge(env)
  const messages = [
    { role: 'system', content: 'You are Next for an internal Otya operations task.' },
    { role: 'user', content: 'How does Otya Transfer work?' },
  ]
  await runtime.AI.run('model', { messages })
  assert.equal(searches, 0)
  assert.deepEqual(received.messages, messages)
})
