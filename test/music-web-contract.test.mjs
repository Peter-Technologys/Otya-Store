import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('website navigation uses the canonical OTYA mark', () => {
  const nav = read('src/components/SiteNav.tsx')
  const mark = read('src/components/OtyaBrandMark.tsx')
  assert.match(nav, /OtyaBrandMark/)
  assert.match(mark, /otya-icon\.svg/)
  assert.match(mark, /otya-icon-dark\.svg/)
  assert.doesNotMatch(nav, /web-app-manifest-192x192\.png/)
})

test('music page keeps a persistent audio element and uses OTYA download route', () => {
  const page = read('src/app/music/page.tsx')
  assert.match(page, /ref=\{audioRef\}/)
  assert.match(page, /audio\.src = track\.streamUrl/)
  assert.match(page, /\/api\/music\/jamendo\/download\//)
})

test('Jamendo download route forces mp3 content type and filename', () => {
  const route = read('src/app/api/music/jamendo/download/[id]/route.ts')
  assert.match(route, /Content-Type', 'audio\/mpeg'/)
  assert.match(route, /Content-Disposition'/)
  assert.match(route, /\.mp3`/)
  assert.match(route, /audiodownload_allowed !== true/)
})
