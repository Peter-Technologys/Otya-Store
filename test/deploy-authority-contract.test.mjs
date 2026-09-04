import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflow = readFileSync(
  new URL('../.github/workflows/deploy.yml', import.meta.url),
  'utf8',
)

test('pushes and pull requests validate but cannot deploy production', () => {
  assert.match(workflow, /workflow_dispatch:/)
  assert.match(workflow, /default: 'validate-only'/)
  assert.match(workflow, /Type DEPLOY to authorize a production deployment/)
  assert.match(workflow, /test "\$TARGET_REF" = 'refs\/heads\/main'/)
  assert.match(workflow, /test "\$CONFIRM" = 'DEPLOY'/)

  const plan = workflow.slice(
    workflow.indexOf('  plan-deploy:'),
    workflow.indexOf('  deploy-auth:'),
  )
  assert.match(plan, /github\.event_name == 'workflow_dispatch'/)
  assert.doesNotMatch(plan, /github\.event_name == 'push'/)
  assert.match(plan, /auth=false/)
  assert.match(plan, /next=false/)
  assert.match(plan, /core=false/)

  for (const job of ['deploy-auth', 'deploy-next', 'deploy-core', 'verify-production']) {
    const start = workflow.indexOf(`  ${job}:`)
    assert.ok(start >= 0, `${job} must exist`)
    const nextJob = workflow.indexOf('\n  ', start + 3)
    const block = workflow.slice(start, nextJob >= 0 ? nextJob : undefined)
    assert.match(block, /github\.event_name == 'workflow_dispatch'/)
    assert.match(block, /github\.ref == 'refs\/heads\/main'/)
    assert.doesNotMatch(block, /github\.event_name == 'push'/)
  }
})
