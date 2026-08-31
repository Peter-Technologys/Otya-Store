import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(new URL('../src/app/api/version/route.ts', import.meta.url), 'utf8')

test('/api/version invokes the canonical /latest handler explicitly', () => {
  assert.match(source, /import\s*\{\s*GET\s+as\s+getLatest\s*\}\s*from\s*['"]\.\.\/\.\.\/latest\/route['"]/)
  assert.match(source, /export\s+async\s+function\s+GET\s*\(/)
  assert.match(source, /return\s+getLatest\(request\)/)
  assert.doesNotMatch(source, /export\s*\{\s*GET\s*\}\s*from/)
})
