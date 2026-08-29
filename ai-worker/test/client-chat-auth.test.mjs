import test from 'node:test'
import assert from 'node:assert/strict'

import { handlePublicChat } from '../src/client-chat.mjs'

const env = {
  INTERNAL_SECRET: 'test-internal-secret',
}

async function body(response) {
  return response.json()
}

test('direct AI requests cannot spoof a signed-in OTYA identity', async () => {
  const request = new Request('https://otya-ai.example/api/ai/chat?models=1', {
    headers: {
      'X-OTYA-User-ID': 'victim-user-id',
      'X-OTYA-Persist-Chat': '1',
    },
  })

  const response = await handlePublicChat(request, env)
  const data = await body(response)

  assert.equal(response.status, 200)
  assert.equal(data.signed_in, false)
  assert.equal(data.models.length, 1)
  assert.equal(data.models[0].id, data.guest_model)
})

test('verified store proxy can enable persistent signed-in chat identity', async () => {
  const request = new Request('https://otya-ai.example/api/ai/chat?models=1', {
    headers: {
      'X-OTYA-Internal-Secret': env.INTERNAL_SECRET,
      'X-OTYA-User-ID': 'verified-user-id',
      'X-OTYA-Persist-Chat': '1',
    },
  })

  const response = await handlePublicChat(request, env)
  const data = await body(response)

  assert.equal(response.status, 200)
  assert.equal(data.signed_in, true)
  assert.ok(data.models.length > 1)
  assert.equal(data.models[0].id, 'llama-fast')
})

test('wrong internal marker remains guest-only', async () => {
  const request = new Request('https://otya-ai.example/api/ai/chat?models=1', {
    headers: {
      'X-OTYA-Internal-Secret': 'wrong-secret',
      'X-OTYA-User-ID': 'victim-user-id',
      'X-OTYA-Persist-Chat': '1',
    },
  })

  const response = await handlePublicChat(request, env)
  const data = await body(response)

  assert.equal(data.signed_in, false)
  assert.equal(data.models.length, 1)
})
