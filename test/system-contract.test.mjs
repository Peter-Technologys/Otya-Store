import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('Admin browser session stays cookie-based and URL-safe', () => {
  const source = read('src/lib/admin_auth.ts')
  assert.match(source, /HttpOnly/)
  assert.match(source, /Secure/)
  assert.match(source, /SameSite=Strict/)
  assert.match(source, /Max-Age=/)
  assert.doesNotMatch(source, /searchParams\.get\([^)]*token/i)
  assert.doesNotMatch(source, /queryParameters[^\n]*token/i)
})

test('Ask OTYA keeps a low-cost guest model and curated signed-in catalog', () => {
  const config = read('ai-worker/wrangler.toml')
  const chat = read('ai-worker/src/client-chat.mjs')

  assert.match(config, /AI_GUEST_MODEL = "llama-fast"/)
  assert.match(config, /AI_DEFAULT_MODEL = "otya-smart"/)

  const catalogLine = config.match(/^AI_PUBLIC_MODELS\s*=\s*"([^"]+)"$/m)
  assert.ok(catalogLine, 'AI_PUBLIC_MODELS must be present in ai-worker/wrangler.toml')
  const configuredModels = catalogLine[1].split(',').map(value => value.trim()).filter(Boolean)
  const expected = [
    'llama-fast',
    'otya-smart',
    'gemma-4',
    'granite',
    'llama-70b',
    'gpt-oss-20b',
    'gpt-oss-120b',
    'nemotron',
    'llama-4-scout',
    'qwen3',
    'sea-lion',
  ]
  for (const id of expected) assert.ok(configuredModels.includes(id), `${id} must remain in AI_PUBLIC_MODELS`)

  assert.match(chat, /if\(!signedIn\).*policy\.guest/)
  assert.match(chat, /friendly general-purpose AI assistant built into OTYA/)
})

test('Free-plan OTYA catalog does not advertise paid-only GLM 5.3', () => {
  const config = read('ai-worker/wrangler.toml')
  const chat = read('ai-worker/src/client-chat.mjs')
  assert.doesNotMatch(config, /glm-5\.3/i)
  assert.doesNotMatch(chat, /glm-5\.3/i)
})

test('Cloudflare remains the public release and AI control plane', () => {
  const chat = read('ai-worker/src/client-chat.mjs')
  assert.match(chat, /Official website:/)
  assert.match(chat, /\/latest/)
  assert.match(chat, /Local playback, media scanning, local search and supported local transfer must keep working without signing in or using AI/)
})
