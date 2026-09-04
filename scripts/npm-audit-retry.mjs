import { spawnSync } from 'node:child_process'

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const args = ['audit', ...process.argv.slice(2)]
const maxAttempts = 3
const retryDelayMs = 7000
const transientAuditFailure = /503 Service Unavailable|502 Bad Gateway|504 Gateway Timeout|audit endpoint returned an error|ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up/i

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  const result = spawnSync(npm, args, {
    encoding: 'utf8',
    env: process.env,
  })
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  if (result.error) throw result.error
  if (result.status === 0) process.exit(0)

  const output = `${result.stdout || ''}\n${result.stderr || ''}`
  const transient = transientAuditFailure.test(output)
  if (!transient || attempt === maxAttempts) {
    process.exit(result.status ?? 1)
  }

  console.warn(
    `[security] npm audit service unavailable; retrying in ${retryDelayMs}ms (${attempt + 1}/${maxAttempts}).`,
  )
  sleepSync(retryDelayMs)
}

process.exit(1)
