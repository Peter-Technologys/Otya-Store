import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('organization navigation identifies PeterSmart Link while the Otya product mark stays canonical', () => {
  const nav = read('src/components/SiteNav.tsx')
  const mark = read('src/components/OtyaBrandMark.tsx')
  const icon = read('public/otya-icon.svg')
  const darkIcon = read('public/otya-icon-dark.svg')

  assert.match(nav, /PeterSmart Link/)
  assert.match(nav, /\['Otya', '\/otya-player'\]/)
  assert.match(mark, /otya-icon\.svg/)
  assert.match(mark, /otya-icon-dark\.svg/)
  assert.doesNotMatch(nav, /web-app-manifest-192x192\.png/)

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

test('Music web page describes the local product and has no streaming catalog runtime', () => {
  const page = read('src/app/music/page.tsx')
  assert.match(page, /Local-first music/)
  assert.match(page, /No (?:built-in )?online music catalog/i)
  assert.match(page, /songs already on your Android device/i)
  assert.doesNotMatch(page, /api\/music\/jamendo/i)
  assert.doesNotMatch(page, /streamUrl|audioRef|<audio/i)
})

test('retired Online Music provider endpoints stay physically absent', () => {
  for (const path of [
    'src/app/api/music/jamendo/route.ts',
    'src/app/api/music/jamendo/status/route.ts',
    'src/app/api/music/jamendo/download/[id]/route.ts',
    'src/app/api/music/jamendo/oauth/start/route.ts',
    'src/app/api/music/jamendo/oauth/callback/route.ts',
  ]) {
    assert.equal(existsSync(new URL(`../${path}`, import.meta.url)), false, `${path} must stay removed`)
  }
})

test('legacy Online Music documentation redirects to the current local Music page', () => {
  const docs = read('src/app/docs/online-music/page.tsx')
  assert.match(docs, /permanentRedirect\('\/music'\)/)
  assert.doesNotMatch(docs, /Jamendo|streamed from the provider/i)
})
