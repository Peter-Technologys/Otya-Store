import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = path => readFileSync(path, 'utf8')

test('public product, assistant and release names stay simple', () => {
  const apkRoute = read('src/app/apk/[file]/route.ts')
  const release = read('src/release-workflow.mjs')
  const accountShell = read('src/components/OtyaSpaceChrome.tsx')

  assert.match(apkRoute, /Otya-arm64\.apk/)
  assert.match(apkRoute, /Otya-arm32\.apk/)
  assert.doesNotMatch(apkRoute, /OtyaPlayer/)

  assert.match(release, /releases\/\$\{tag\}\/Otya-arm64\.apk/)
  assert.match(release, /releases\/\$\{tag\}\/Otya-arm32\.apk/)
  assert.match(release, /Otya \$\{release\.version\} is ready\./)
  assert.doesNotMatch(release, /OTYA Player/)

  assert.match(accountShell, /label: 'Next'/)
  assert.match(accountShell, />Otya<\/div><div className="text-\[11px\] otya-muted">Account<\/div>/)
  assert.doesNotMatch(accountShell, /Otya Space/)
  assert.doesNotMatch(accountShell, /Otya AI/)
})
