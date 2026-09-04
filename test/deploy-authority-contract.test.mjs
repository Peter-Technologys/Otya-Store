import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflow = readFileSync(
  new URL('../.github/workflows/deploy.yml', import.meta.url),
  'utf8',
)

function jobBlock(name, nextName) {
  const start = workflow.indexOf(`  ${name}:`)
  assert.ok(start >= 0, `${name} must exist`)
  const end = nextName ? workflow.indexOf(`\n  ${nextName}:`, start + 1) : workflow.length
  assert.ok(end > start, `${nextName ?? 'end of workflow'} must follow ${name}`)
  return workflow.slice(start, end)
}

test('pushes and pull requests validate but cannot deploy production', () => {
  assert.match(workflow, /workflow_dispatch:/)
  assert.match(workflow, /default: 'validate-only'/)
  assert.match(workflow, /Type DEPLOY to authorize a production deployment/)
  assert.match(workflow, /test "\$TARGET_REF" = 'refs\/heads\/main'/)
  assert.match(workflow, /test "\$CONFIRM" = 'DEPLOY'/)

  const plan = jobBlock('plan-deploy', 'deploy-auth')
  assert.match(plan, /github\.event_name == 'workflow_dispatch'/)
  assert.doesNotMatch(plan, /github\.event_name == 'push'/)
  assert.match(plan, /auth=false/)
  assert.match(plan, /next=false/)
  assert.match(plan, /core=false/)

  const blocks = [
    jobBlock('deploy-auth', 'deploy-next'),
    jobBlock('deploy-next', 'deploy-core'),
    jobBlock('deploy-core', 'verify-production'),
    jobBlock('verify-production'),
  ]
  for (const block of blocks) {
    assert.match(block, /github\.event_name == 'workflow_dispatch'/)
    assert.match(block, /github\.ref == 'refs\/heads\/main'/)
    assert.doesNotMatch(block, /github\.event_name == 'push'/)
  }
})
