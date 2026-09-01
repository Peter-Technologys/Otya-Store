import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('Next keeps the named AI Gateway across the production knowledge wrapper', () => {
  const wrangler = read('ai-worker/wrangler.toml')
  const productionEntry = read('ai-worker/src/production-entry.mjs')
  const scheduledEntry = read('ai-worker/src/scheduled-entry.mjs')

  assert.match(wrangler, /^name\s*=\s*"otya-next"$/m)
  assert.match(wrangler, /^main\s*=\s*"src\/production-entry\.mjs"$/m)
  assert.match(wrangler, /^AI_GATEWAY_ID\s*=\s*"otya-next-gateway"$/m)

  assert.match(productionEntry, /import worker from '\.\/scheduled-entry\.mjs'/)
  assert.match(productionEntry, /import \{ withPublicNextKnowledge \} from '\.\/next-knowledge-runtime\.mjs'/)
  assert.match(productionEntry, /worker\.fetch\(request, withPublicNextKnowledge\(env\), ctx\)/)
  assert.match(productionEntry, /worker\.queue\(batch, env, ctx\)/)
  assert.match(productionEntry, /worker\.scheduled\(event, env, ctx\)/)

  assert.match(scheduledEntry, /function withAiGateway\(env\)/)
  assert.match(scheduledEntry, /gatewayId=String\(env\.AI_GATEWAY_ID/)
  assert.match(scheduledEntry, /gateway:\{\.\.\.priorGateway,id:gatewayId,skipCache:true\}/)

  assert.match(scheduledEntry, /const runtimeEnv=withAiGateway\(env\)/)
  assert.match(scheduledEntry, /aiWorker\.fetch\(request,runtimeEnv,ctx\)/)
  assert.match(scheduledEntry, /aiWorker\.queue\(batch,withAiGateway\(env\),ctx\)/)
  assert.match(scheduledEntry, /weekly\(runtimeEnv\)/)
  assert.match(scheduledEntry, /daily\(runtimeEnv\)/)
  assert.match(scheduledEntry, /urgent\(runtimeEnv\)/)
})
