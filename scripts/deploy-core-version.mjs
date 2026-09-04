import { spawnSync } from 'node:child_process'
import { readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const outputFile = join(tmpdir(), `otya-wrangler-${process.pid}.jsonl`)
const sha = (process.env.GITHUB_SHA || '').trim()
const versionTag = sha ? `web-${sha.slice(0, 12)}` : `web-${Date.now()}`
const message = sha ? `OTYA web ${sha.slice(0, 12)}` : 'OTYA web deployment'
const VERSION_VISIBILITY_ATTEMPTS = 12
const VERSION_VISIBILITY_DELAY_MS = 15000
const VERSION_DEPLOY_ATTEMPTS = 3
const VERSION_DEPLOY_DELAY_MS = 5000

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

function isVersionVisibilityError(output) {
  return /100146|requested Worker version could not be found/i.test(output)
}

function waitForVersionVisibility(versionId) {
  const args = [
    'wrangler',
    'versions',
    'view',
    versionId,
    '--config',
    'wrangler.toml',
    '--json',
  ]

  for (let attempt = 1; attempt <= VERSION_VISIBILITY_ATTEMPTS; attempt++) {
    const result = spawnSync(npx, args, {
      encoding: 'utf8',
      env: process.env,
    })
    if (result.error) throw result.error
    if (result.status === 0) {
      console.log(`[deploy-core] Uploaded Worker version ${versionId} is visible to the Versions API.`)
      return
    }

    const output = `${result.stdout || ''}\n${result.stderr || ''}`
    if (!isVersionVisibilityError(output)) {
      if (result.stdout) process.stdout.write(result.stdout)
      if (result.stderr) process.stderr.write(result.stderr)
      throw new Error(`Command failed: npx ${args.join(' ')}`)
    }

    if (attempt === VERSION_VISIBILITY_ATTEMPTS) {
      if (result.stdout) process.stdout.write(result.stdout)
      if (result.stderr) process.stderr.write(result.stderr)
      throw new Error(
        `Uploaded Worker version ${versionId} was still not visible after ${VERSION_VISIBILITY_ATTEMPTS} checks.`,
      )
    }

    console.warn(
      `[deploy-core] Uploaded Worker version is not visible yet; checking again in ${VERSION_VISIBILITY_DELAY_MS}ms (attempt ${attempt + 1}/${VERSION_VISIBILITY_ATTEMPTS}).`,
    )
    sleepSync(VERSION_VISIBILITY_DELAY_MS)
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

  for (let attempt = 1; attempt <= VERSION_DEPLOY_ATTEMPTS; attempt++) {
    const result = spawnSync(npx, args, {
      encoding: 'utf8',
      env: process.env,
    })
    if (result.stdout) process.stdout.write(result.stdout)
    if (result.stderr) process.stderr.write(result.stderr)
    if (result.error) throw result.error
    if (result.status === 0) return

    const output = `${result.stdout || ''}\n${result.stderr || ''}`
    if (!isVersionVisibilityError(output) || attempt === VERSION_DEPLOY_ATTEMPTS) {
      throw new Error(`Command failed: npx ${args.join(' ')}`)
    }

    console.warn(
      `[deploy-core] Worker version disappeared during promotion; re-checking visibility before retry ${attempt + 1}/${VERSION_DEPLOY_ATTEMPTS}.`,
    )
    sleepSync(VERSION_DEPLOY_DELAY_MS * attempt)
    waitForVersionVisibility(versionId)
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

  // Cloudflare's Versions API can be eventually consistent immediately after
  // upload. Verify that the exact returned ID can be read before asking the
  // deployments API to promote it to production traffic. This avoids turning
  // a transient 100146 race into a failed production rollout.
  waitForVersionVisibility(versionId)
  deployUploadedVersion(versionId)
} finally {
  rmSync(outputFile, { force: true })
}
