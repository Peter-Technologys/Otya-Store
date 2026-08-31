import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('generic release downloads never silently select ARM64', () => {
  const latest = read('src/app/latest/route.ts')
  const workflow = read('src/release-workflow.mjs')

  assert.match(latest, /const DOWNLOAD_PAGE = 'https:\/\/petersmartlink\.com\/download\/otya-player'/)
  assert.match(latest, /auto:\s+DOWNLOAD_PAGE/)
  assert.doesNotMatch(latest, /auto:\s+ARM64_APK/)

  assert.match(workflow, /auto: `\$\{release\.workerUrl\}\/download\/otya-player`/)
  assert.match(workflow, /arm64: `\$\{release\.workerUrl\}\/apk\/arm64`/)
  assert.match(workflow, /arm32: `\$\{release\.workerUrl\}\/apk\/arm32`/)
})
