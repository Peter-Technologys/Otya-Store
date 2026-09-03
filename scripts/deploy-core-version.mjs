import { spawnSync } from 'node:child_process'
import { readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const outputFile = join(tmpdir(), `otya-wrangler-${process.pid}.jsonl`)
const sha = (process.env.GITHUB_SHA || '').trim()
const versionTag = sha ? `web-${sha.slice(0, 12)}` : `web-${Date.now()}`
const message = sha ? `OTYA web ${sha.slice(0, 12)}` : 'OTYA web deployment'

function run(args, extraEnv = {}) {
  const result = spawnSync(npx, args, {
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  })
  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`Command failed: npx ${args.join(' ')}`)
  }
}

try {
  rmSync(outputFile, { force: true })

  run(
    [
      'wrangler',
      'versions',
      'upload',
      'src/production-router.mjs',
      '--config',
      'wrangler.toml',
      '--tag',
      versionTag,
      '--message',
      message,
    ],
    { WRANGLER_OUTPUT_FILE_PATH: outputFile },
  )

  const events = readFileSync(outputFile, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line => JSON.parse(line))

  const upload = [...events].reverse().find(event => event?.type === 'version-upload')
  const versionId = typeof upload?.version_id === 'string' ? upload.version_id.trim() : ''
  if (!versionId) throw new Error('Wrangler did not report an uploaded Worker version ID.')

  run([
    'wrangler',
    'versions',
    'deploy',
    `${versionId}@100%`,
    '--config',
    'wrangler.toml',
    '--message',
    message,
    '-y',
  ])
} finally {
  rmSync(outputFile, { force: true })
}
