import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = path => readFileSync(path, 'utf8')

test('public OTYA surfaces and Android download naming stay simple', () => {
  const apkRoute = read('src/app/apk/[file]/route.ts')
  const legacyDownload = read('src/app/download/otya-player/page.tsx')
  const canonicalDownload = read('src/app/download/otya/page.tsx')
  const spaceShell = read('src/components/OtyaSpaceChrome.tsx')

  assert.match(apkRoute, /Otya-arm64\.apk/)
  assert.match(apkRoute, /Otya-arm32\.apk/)
  assert.doesNotMatch(apkRoute, /OtyaPlayer/)

  assert.match(legacyDownload, /redirect\('\/download\/otya'\)/)
  assert.match(canonicalDownload, /title: 'Download Otya'/)
  assert.match(canonicalDownload, /canonical: 'https:\/\/petersmartlink\.com\/download\/otya'/)

  assert.match(spaceShell, /label: 'Next'/)
  assert.match(spaceShell, />OTYA<\/div><div className="text-\[11px\] otya-muted">Space<\/div>/)
  assert.match(spaceShell, /aria-label="OTYA Space home"/)
  assert.doesNotMatch(spaceShell, /Otya AI/)
})
