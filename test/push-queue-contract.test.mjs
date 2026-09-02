import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const wrangler = read('wrangler.toml')
const queueWorker = read('src/queue-worker.mjs')

test('core queue consumer matches the canonical Cloudflare push queue', () => {
  assert.match(wrangler, /binding\s*=\s*"PUSH_QUEUE"[\s\S]*?queue\s*=\s*"otya-push"/)
  assert.match(wrangler, /\[\[queues\.consumers\]\][\s\S]*?queue\s*=\s*"otya-push"/)
  assert.match(queueWorker, /batch\.queue !== 'otya-push'/)
  assert.doesNotMatch(queueWorker, /otya-push-queue/)
  assert.doesNotMatch(queueWorker, /otya-store received unexpected queue/)
})

test('FCM service-account OAuth exchange keeps the standard JWT bearer grant', () => {
  assert.match(queueWorker, /urn:ietf:params:oauth:grant-type:jwt-bearer/)
})
