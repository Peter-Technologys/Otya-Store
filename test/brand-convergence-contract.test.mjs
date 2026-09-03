import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('Next uses the three-ball identity while generic web loading stays product-branded', () => {
  const mark = read('src/components/OtyaBrandMark.tsx')
  const consoleUi = read('src/app/admin/ai/ConsoleClient.tsx')
  const loading = read('src/app/loading.tsx')
  const ai = read('public/otya-ai.svg')
  const thinking = read('public/otya-ai-thinking.svg')

  assert.match(mark, /ai\?: boolean/)
  assert.match(mark, /Next, Otya's assistant/)
  assert.match(mark, /src = thinking \? '\/otya-ai-thinking\.svg' : '\/otya-ai\.svg'/)
  assert.match(consoleUi, /<OtyaBrandMark ai/)
  assert.match(consoleUi, /<OtyaBrandMark ai[^>]*thinking/)
  assert.match(consoleUi, />Next</)
  assert.doesNotMatch(consoleUi, />Otya AI</)
  assert.doesNotMatch(consoleUi, />Command</)
  assert.match(loading, /<OtyaBrandMark size=\{64\}/)
  assert.match(loading, /Loading Otya Player/)
  assert.doesNotMatch(loading, /<OtyaBrandMark ai thinking/)
  assert.doesNotMatch(loading, /Next is getting/)

  for (const source of [ai, thinking]) {
    assert.match(source, /#2979FF|#1767e8/i)
    assert.match(source, /#FF3B30|#d51c15/i)
    assert.match(source, /#FFD60A|#e0a900/i)
  }
  assert.doesNotMatch(thinking, /M160 98|folded O/i)
})

test('website metadata and visual tokens reflect the first public Otya release', () => {
  const layout = read('src/app/layout.tsx')
  const brand = read('src/app/brand-overrides.css')

  assert.match(layout, /const APP_VERSION = '1\.0\.0'/)
  assert.match(layout, /import '\.\/brand-overrides\.css'/)
  assert.match(brand, /--otya-blue: #2979FF/)
  assert.match(brand, /--otya-red: #FF3B30/)
  assert.match(brand, /--otya-yellow: #FFD60A/)
  assert.match(brand, /--cosmos-scaffold: #080B12/)
})
