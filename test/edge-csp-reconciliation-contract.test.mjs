import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('normal core deploy does not mutate unrelated edge CSP rules', () => {
  const pkg = JSON.parse(read('package.json'))

  assert.match(pkg.scripts.deploy, /wrangler deploy src\/production-router\.mjs --config wrangler\.toml/)
  assert.doesNotMatch(pkg.scripts.deploy, /remove-legacy-edge-csp/)
  assert.equal(pkg.scripts['maintenance:edge-csp'], 'bash scripts/remove-legacy-edge-csp.sh')
})

test('explicit edge CSP maintenance remains narrowly fingerprinted', () => {
  const script = read('scripts/remove-legacy-edge-csp.sh')

  assert.match(script, /http_response_headers_transform/)
  assert.match(script, /content-security-policy/)
  assert.match(script, /unsafe-eval/)
  assert.match(script, /www\.googletagmanager\.com/)
  assert.match(script, /static\.cloudflareinsights\.com/)
  assert.match(script, /match_count.*!= '1'/s)
  assert.match(script, /rulesets\/\$\{ruleset_id\}\/rules\/\$\{rule_id\}/)
  assert.doesNotMatch(script, /DELETE[^\n]*\/zones\/\$\{zone_id\}(?:\s|$)/)
  assert.doesNotMatch(script, /rulesets\/\$\{ruleset_id\}["']?\s*\)?\s*$/m)
})
