import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('core deploy retries only Cloudflare uploaded-version discovery lag', () => {
  const deploy = read('scripts/deploy-core-version.mjs')
  assert.match(deploy, /VERSION_DISCOVERY_ATTEMPTS = 4/)
  assert.match(deploy, /VERSION_DISCOVERY_DELAY_MS = 3000/)
  assert.match(deploy, /100146\|requested Worker version could not be found/i)
  assert.match(deploy, /deployUploadedVersion\(versionId\)/)
  assert.match(deploy, /attempt === VERSION_DISCOVERY_ATTEMPTS/)
  assert.match(deploy, /throw new Error\(`Command failed: npx/)
})
