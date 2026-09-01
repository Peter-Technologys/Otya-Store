import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const router = readFileSync(new URL('../ai-worker/src/scheduled-entry.mjs', import.meta.url), 'utf8')
const stream = readFileSync(new URL('../ai-worker/src/client-chat-stream.mjs', import.meta.url), 'utf8')

test('Next streaming is opt-in and preserves the JSON chat fallback', () => {
  assert.match(router, /handlePublicChatStream/)
  assert.match(router, /const streamed=await handlePublicChatStream\(request,runtimeEnv\)/)
  assert.match(router, /if\(streamed\)return streamed/)
  assert.match(router, /return handlePublicChat\(request,runtimeEnv\)/)
  assert.match(stream, /Accept'\)\?\.includes\('text\/event-stream'\)/)
  assert.match(stream, /return null/)
})

test('Next requests native Workers AI streaming and emits SSE deltas', () => {
  assert.match(stream, /stream:true/)
  assert.match(stream, /Content-Type':'text\/event-stream; charset=utf-8'/)
  assert.match(stream, /type:'meta'/)
  assert.match(stream, /type:'delta'/)
  assert.match(stream, /type:'done'/)
  assert.match(stream, /X-OTYA-Stream':'1'/)
})

test('signed-in streamed conversations persist user and assistant messages', () => {
  assert.match(stream, /X-OTYA-Persist-Chat/)
  assert.match(stream, /appendMessage\(env,\{conversationId:conversation\.id,role:'user'/)
  assert.match(stream, /appendMessage\(env,\{conversationId:prepared\.conversationId,role:'assistant'/)
})

test('streaming keeps secrets and account state behind trusted service headers', () => {
  assert.match(stream, /X-OTYA-Internal-Secret/)
  assert.match(stream, /X-OTYA-User-ID/)
  assert.doesNotMatch(stream, /Authorization:`Bearer \$\{env\./)
})
