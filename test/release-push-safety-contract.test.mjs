import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const queue = readFileSync(new URL('../src/queue-worker.mjs', import.meta.url), 'utf8')
const release = readFileSync(new URL('../src/release-workflow.mjs', import.meta.url), 'utf8')
const wrangler = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8')

test('core consumes exactly the canonical OTYA push queue', () => {
  assert.match(wrangler, /queue\s*=\s*"otya-push"/)
  assert.match(queue, /batch\.queue !== 'otya-push'/)
  assert.doesNotMatch(queue, /otya-push-queue/)
  assert.doesNotMatch(queue, /otya-store received unexpected queue/)
})

test('release publication requires explicit confirmation for the exact tag', () => {
  assert.match(release, /raw\.approval !== 'PUBLISH'/)
  assert.match(release, /raw\.confirmTag !== tag/)
  assert.match(release, /Explicit admin publication approval is required/)
  const approvalIndex = release.indexOf("raw.approval !== 'PUBLISH'")
  const d1Index = release.indexOf('upsert D1 release metadata safely')
  const metadataIndex = release.indexOf('publish version metadata')
  assert.ok(approvalIndex >= 0 && approvalIndex < d1Index && approvalIndex < metadataIndex)
})

test('release push payload satisfies the canonical push consumer contract', () => {
  assert.match(queue, /if \(!title \|\| !body\) throw new Error\('Missing required fields: title, body'\)/)
  assert.match(release, /title: `OTYA \$\{release\.version\} is available`/)
  assert.match(release, /body: metadata\.changelog \|\| 'A new OTYA update is available\.'/)
  assert.match(release, /PUSH_QUEUE\.send/)
})

test('release event queue remains unattached until dedicated intake exists', () => {
  const consumerBlocks = [...wrangler.matchAll(/\[\[queues\.consumers\]\][\s\S]*?(?=\n\[\[|\n\[|$)/g)].map(match => match[0])
  assert.ok(consumerBlocks.some(block => /queue\s*=\s*"otya-push"/.test(block)))
  assert.ok(!consumerBlocks.some(block => /queue\s*=\s*"otya-release-events"/.test(block)))
})
