import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const entrypoints = [
  '../src/entrypoint.mjs',
  '../src/telegram-entrypoint.mjs',
  '../src/production-router.mjs',
]

test('deployed JavaScript worker entrypoints parse before Wrangler deploy', () => {
  for (const relative of entrypoints) {
    const path = fileURLToPath(new URL(relative, import.meta.url))
    const result = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' })
    assert.equal(
      result.status,
      0,
      `${relative} must parse successfully before deployment:\n${result.stderr || result.stdout}`,
    )
  }
})
