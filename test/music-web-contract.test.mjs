import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('website navigation uses the canonical OTYA mark', () => {
  const nav = read('src/components/SiteNav.tsx')
  const mark = read('src/components/OtyaBrandMark.tsx')
  const icon = read('public/otya-icon.svg')
  const darkIcon = read('public/otya-icon-dark.svg')

  assert.match(nav, /OtyaBrandMark/)
  assert.match(mark, /otya-icon\.svg/)
  assert.match(mark, /otya-icon-dark\.svg/)
  assert.doesNotMatch(nav, /web-app-manifest-192x192\.png/)

  // Protect OTYA's recognizable folded-O geometry. Product polish may tune
  // rendering, contrast and spacing, but must not replace this with a generic
  // ring/play mark. Next keeps its own separate three-ball assistant mark.
  for (const source of [icon, darkIcon]) {
    assert.match(source, /M160 98 138 117 116 146/)
    assert.match(source, /M180 142 159 147 139 157/)
    assert.match(source, /M405 164 410 190 408 224/)
    assert.match(source, /#2979ff/i)
    assert.match(source, /#ff3b30/i)
    assert.match(source, /#ffd60a/i)
    assert.doesNotMatch(source, /M256 106a150 150/)
  }
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