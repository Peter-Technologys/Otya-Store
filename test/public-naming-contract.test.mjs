import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const constants = readFileSync(new URL('../src/lib/constants.ts', import.meta.url), 'utf8')
const product = readFileSync(new URL('../src/app/otya-player/page.tsx', import.meta.url), 'utf8')
const help = readFileSync(new URL('../src/app/help/page.tsx', import.meta.url), 'utf8')

const visible = `${constants}\n${product}\n${help}`

test('public brand uses OTYA and Next while the Android product is Otya Player', () => {
  assert.match(constants, /name: 'OTYA'/)
  assert.match(constants, /ai: 'Next'/)
  assert.match(product, /Otya Player/)
  assert.match(product, /\['Next'/)
  assert.match(product, />Open Next</)
  assert.match(help, />Next</)
})

test('legacy public AI names do not return to primary surfaces', () => {
  assert.doesNotMatch(visible, /Ask Otya/i)
  assert.doesNotMatch(visible, /Ask OTYA/)
})
