import test from 'node:test'
import assert from 'node:assert/strict'
import { decodeWorkflowPayload } from '../src/lib/workflow_payload.mjs'

test('decodes the JSON string supplied by the Cloudflare Workflows API', () => {
  assert.deepEqual(
    decodeWorkflowPayload('{"tag":"v1.0.0","versionCode":1}'),
    { tag: 'v1.0.0', versionCode: 1 },
  )
})

test('accepts binding-triggered object payloads without changing them', () => {
  const payload = { tag: 'v1.0.0' }
  assert.equal(decodeWorkflowPayload(payload), payload)
})

test('rejects malformed or non-object workflow payloads', () => {
  assert.throws(() => decodeWorkflowPayload('{'), /must be valid JSON/)
  assert.throws(() => decodeWorkflowPayload('[]'), /must be a JSON object/)
})
