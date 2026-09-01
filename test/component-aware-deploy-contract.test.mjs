import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflow = readFileSync(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8')

test('full validation remains mandatory before deployment planning', () => {
  assert.match(workflow, /validate:\n[\s\S]*Validate complete OTYA backend/)
  assert.match(workflow, /plan-deploy:[\s\S]*needs: validate/)
  assert.match(workflow, /Validate auth worker/)
  assert.match(workflow, /Validate Next worker/)
})

test('runtime changes are classified by owner instead of redeploying everything', () => {
  assert.match(workflow, /auth-worker\/\*\)[\s\S]*auth=true/)
  assert.match(workflow, /ai-worker\/\*\)[\s\S]*next=true/)
  assert.match(workflow, /\*\)[\s\S]*core=true/)
  assert.match(
    workflow,
    /\.github\/workflows\/\*\|docs\/\*\|test\/\*\|validate-config\.mjs\|\*\.md/,
  )
  assert.match(workflow, /No usable previous commit; conservatively deploying all runtime components/)
})

test('auth D1 repair only runs when auth deployment is selected', () => {
  const authStart = workflow.indexOf('deploy-auth:')
  const nextStart = workflow.indexOf('deploy-next:')
  const authJob = workflow.slice(authStart, nextStart)

  assert.match(authJob, /needs\.plan-deploy\.outputs\.auth == 'true'/)
  assert.match(authJob, /Repair and verify preserved auth D1/)
})

test('multi-component deploys remain ordered and fail closed', () => {
  assert.match(workflow, /deploy-next:[\s\S]*needs: \[validate, plan-deploy, deploy-auth\]/)
  assert.match(workflow, /deploy-core:[\s\S]*needs: \[validate, plan-deploy, deploy-auth, deploy-next\]/)
  assert.match(workflow, /needs\.deploy-auth\.result == 'success' \|\| needs\.deploy-auth\.result == 'skipped'/)
  assert.match(workflow, /needs\.deploy-next\.result == 'success' \|\| needs\.deploy-next\.result == 'skipped'/)
})

test('live verification covers canonical and legacy Otya download paths', () => {
  assert.match(workflow, /https:\/\/petersmartlink\.com\/download\/otya /)
  assert.match(workflow, /https:\/\/petersmartlink\.com\/download\/otya-player /)
  assert.match(workflow, /needs\.plan-deploy\.outputs\.any_runtime == 'true'/)
})
