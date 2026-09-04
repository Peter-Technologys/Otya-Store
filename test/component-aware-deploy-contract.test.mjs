import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflow = readFileSync(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8')

test('full validation remains mandatory before production authorization and planning', () => {
  assert.match(workflow, /validate:\n[\s\S]*Validate complete OTYA backend/)
  assert.match(workflow, /authorize-deploy:[\s\S]*needs: validate/)
  assert.match(workflow, /plan-deploy:[\s\S]*needs: \[validate, authorize-deploy\]/)
  assert.match(workflow, /Validate auth worker/)
  assert.match(workflow, /Validate Next worker/)
})

test('runtime deployment is selected explicitly instead of inferred from pushed paths', () => {
  assert.match(workflow, /default: 'validate-only'/)
  assert.match(workflow, /auth=false/)
  assert.match(workflow, /next=false/)
  assert.match(workflow, /core=false/)
  assert.match(workflow, /auth\) auth=true/)
  assert.match(workflow, /next\) next=true/)
  assert.match(workflow, /core\) core=true/)
  assert.match(workflow, /all\)[\s\S]*auth=true[\s\S]*next=true[\s\S]*core=true/)
  assert.doesNotMatch(workflow, /No usable previous commit; conservatively deploying all runtime components/)
})

test('auth D1 repair only runs when an authorized auth deployment is selected', () => {
  const authStart = workflow.indexOf('  deploy-auth:')
  const nextStart = workflow.indexOf('  deploy-next:')
  const authJob = workflow.slice(authStart, nextStart)

  assert.match(authJob, /github\.event_name == 'workflow_dispatch'/)
  assert.match(authJob, /needs\.authorize-deploy\.result == 'success'/)
  assert.match(authJob, /needs\.plan-deploy\.outputs\.auth == 'true'/)
  assert.match(authJob, /Repair and verify preserved auth D1/)
})

test('multi-component deploys remain ordered and fail closed', () => {
  assert.match(
    workflow,
    /deploy-next:[\s\S]*needs: \[validate, authorize-deploy, plan-deploy, deploy-auth\]/,
  )
  assert.match(
    workflow,
    /deploy-core:[\s\S]*needs: \[validate, authorize-deploy, plan-deploy, deploy-auth, deploy-next\]/,
  )
  assert.match(
    workflow,
    /verify-production:[\s\S]*needs: \[validate, authorize-deploy, plan-deploy, deploy-auth, deploy-next, deploy-core\]/,
  )
  assert.match(workflow, /needs\.deploy-auth\.result == 'success' \|\| needs\.deploy-auth\.result == 'skipped'/)
  assert.match(workflow, /needs\.deploy-next\.result == 'success' \|\| needs\.deploy-next\.result == 'skipped'/)
})

test('live verification covers canonical and legacy Otya download paths', () => {
  assert.match(workflow, /https:\/\/petersmartlink\.com\/download\/otya /)
  assert.match(workflow, /https:\/\/petersmartlink\.com\/download\/otya-player /)
  assert.match(workflow, /needs\.plan-deploy\.outputs\.any_runtime == 'true'/)
  assert.match(workflow, /github\.event_name == 'workflow_dispatch'/)
})
