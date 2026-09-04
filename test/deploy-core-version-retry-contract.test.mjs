import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('core deploy waits for Cloudflare uploaded-version visibility before promotion', () => {
  const deploy = read('scripts/deploy-core-version.mjs')
  assert.match(deploy, /VERSION_VISIBILITY_ATTEMPTS = 12/)
  assert.match(deploy, /VERSION_VISIBILITY_DELAY_MS = 15000/)
  assert.match(deploy, /versions',\s*'view'/)
  assert.match(deploy, /'--json'/)
  assert.match(deploy, /100146\|requested Worker version could not be found/i)
  assert.match(deploy, /waitForVersionVisibility\(versionId\)/)
  assert.match(deploy, /deployUploadedVersion\(versionId\)/)
  assert.match(deploy, /VERSION_DEPLOY_ATTEMPTS = 3/)
  assert.match(deploy, /throw new Error\(`Command failed: npx/)
})
