import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(
  new URL('../ai-worker/src/scheduled-entry.mjs', import.meta.url),
  'utf8',
)

test('hourly crash alerts keep actionable diagnostics privacy-safe and bounded', () => {
  assert.match(source, /COUNT\(DISTINCT NULLIF\(device_id,''\)\) devices/)
  assert.match(source, /sample_description/)
  assert.match(source, /sample_stack/)
  assert.match(source, /app_version/)
  assert.match(source, /version_code/)
  assert.match(source, /\[redacted-email\]/)
  assert.match(source, /\[redacted-token\]/)
  assert.match(source, /\[redacted-jwt\]/)
  assert.match(source, /\[redacted-device-path\]/)
  assert.match(source, /crashEmailDetail\(x\.sample_description,320\)/)
  assert.match(source, /crashEmailDetail\(x\.sample_stack,420\)/)
  assert.match(source, /LIMIT 6/)
})
