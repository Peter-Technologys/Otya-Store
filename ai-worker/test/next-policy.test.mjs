import assert from 'node:assert/strict'
import test from 'node:test'

import {
  NEXT_BRAND,
  NEXT_DEGRADED_MESSAGE,
  NEXT_PUBLIC_BETA_MODELS,
  classifyNextFailure,
  publicBetaModels,
  safeNextFailureResponse,
} from '../src/next-policy.mjs'

test('public branding uses Otya and Next', () => {
  assert.equal(NEXT_BRAND.product, 'Otya')
  assert.equal(NEXT_BRAND.assistant, 'Next')
  assert.equal(NEXT_BRAND.company, 'PeterSmart Link')
})

test('public beta model policy keeps the economical pool bounded', () => {
  assert.deepEqual(publicBetaModels(''), [...NEXT_PUBLIC_BETA_MODELS])
  assert.deepEqual(
    publicBetaModels('llama-fast,gpt-oss-120b,otya-smart,nemotron'),
    ['llama-fast', 'otya-smart'],
  )
  assert.deepEqual(publicBetaModels('gpt-oss-120b,nemotron'), [...NEXT_PUBLIC_BETA_MODELS])
})

test('quota and temporary AI failures degrade without implying the app is broken', () => {
  assert.equal(classifyNextFailure({ status: 429, message: 'daily neurons quota exceeded' }), 'quota')
  assert.equal(classifyNextFailure(new Error('AI binding unavailable')), 'unavailable')
  assert.equal(classifyNextFailure(new Error('unexpected parser error')), 'unknown')

  const response = safeNextFailureResponse(new Error('quota exceeded'))
  assert.equal(response.ok, false)
  assert.equal(response.code, 'quota')
  assert.equal(response.message, NEXT_DEGRADED_MESSAGE)
  assert.equal(response.local_features_available, true)
  assert.equal(response.retryable, true)
  assert.match(response.message, /local Otya music/i)
})
