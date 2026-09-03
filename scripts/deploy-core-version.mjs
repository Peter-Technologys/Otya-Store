import { spawnSync } from 'node:child_process'
import { readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const outputFile = join(tmpdir(), `otya-wrangler-${process.pid}.jsonl`)
const sha = (process.env.GITHUB_SHA || '').trim()
const versionTag = sha ? `web-${sha.slice(0, 12)}` : `web-${Date.now()}`
const message = sha ? `OTYA web ${sha.slice(0, 12)}` : 'OTYA web deployment'
const VERSION_DISCOVERY_ATTEMPTS = 4
const VERSION_DISCOVERY_DELAY_MS = 3000

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

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

function deployUploadedVersion(versionId) {
  const args = [
    'wrangler',
    'versions',
    'deploy',
    `${versionId}@100%`,
    '--config',
    'wrangler.toml',
    '--message',
    message,
    '-y',
  ]

  for (let attempt = 1; attempt <= VERSION_DISCOVERY_ATTEMPTS; attempt++) {
    const result = spawnSync(npx, args, {
      encoding: 'utf8',
      env: process.env,
    })
    if (result.stdout) process.stdout.write(result.stdout)
    if (result.stderr) process.stderr.write(result.stderr)
    if (result.error) throw result.error
    if (result.status === 0) return

    const output = `${result.stdout || ''}\n${result.stderr || ''}`
    const versionNotVisibleYet = /100146|requested Worker version could not be found/i.test(output)
    if (!versionNotVisibleYet || attempt === VERSION_DISCOVERY_ATTEMPTS) {
      throw new Error(`Command failed: npx ${args.join(' ')}`)
    }

    const delay = VERSION_DISCOVERY_DELAY_MS * attempt
    console.warn(`[deploy-core] Uploaded Worker version is not visible yet; retrying traffic deploy in ${delay}ms (attempt ${attempt + 1}/${VERSION_DISCOVERY_ATTEMPTS}).`)
    sleepSync(delay)
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

  // Cloudflare can briefly return 100146 immediately after a successful
  // versions upload while the new version propagates through the versions API.
  // Retry only that explicit eventual-consistency error; all other deploy
  // failures remain fail-closed and stop production rollout immediately.
  deployUploadedVersion(versionId)
} finally {
  rmSync(outputFile, { force: true })
}
