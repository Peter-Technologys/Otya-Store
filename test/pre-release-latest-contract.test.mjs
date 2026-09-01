import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../src/app/latest/route.ts', import.meta.url), 'utf8')

test('latest has a safe unpublished response before first release', () => {
  assert.ok(source.includes('published: false'))
  assert.ok(source.includes('version: null'))
  assert.ok(source.includes('versionCode: null'))
  assert.ok(source.includes("'X-OTYA-Release-State': 'pre-release'"))
  assert.ok(source.includes('if (!object) return noPublicRelease()'))
})

test('published release metadata keeps explicit download targets', () => {
  assert.ok(source.includes('published: true'))
  assert.ok(source.includes('data.published = true'))
  assert.ok(source.includes('auto: DOWNLOAD_PAGE'))
  assert.ok(source.includes('arm64: ARM64_APK'))
  assert.ok(source.includes('arm32: ARM32_APK'))
})
