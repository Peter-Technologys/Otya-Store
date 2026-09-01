import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = path => readFileSync(path, 'utf8')

test('public account and Android download naming stays simple', () => {
  const apkRoute = read('src/app/apk/[file]/route.ts')
  const legacyDownload = read('src/app/download/otya-player/page.tsx')
  const canonicalDownload = read('src/app/download/otya/page.tsx')
  const accountShell = read('src/components/OtyaSpaceChrome.tsx')

  assert.match(apkRoute, /Otya-arm64\.apk/)
  assert.match(apkRoute, /Otya-arm32\.apk/)
  assert.doesNotMatch(apkRoute, /OtyaPlayer/)

  assert.match(legacyDownload, /redirect\('\/download\/otya'\)/)
  assert.match(canonicalDownload, /title: 'Download Otya'/)
  assert.match(canonicalDownload, /canonical: 'https:\/\/petersmartlink\.com\/download\/otya'/)

  assert.match(accountShell, /label: 'Next'/)
  assert.match(accountShell, />Otya<\/div><div className="text-\[11px\] otya-muted">Account<\/div>/)
  assert.doesNotMatch(accountShell, /Otya Space/)
  assert.doesNotMatch(accountShell, /Otya AI/)
})
