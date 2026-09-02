import { randomBytes } from 'node:crypto'
import { spawnSync } from 'node:child_process'

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'

function runWrangler(args, input) {
  return spawnSync(npx, ['wrangler', ...args], {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
    input,
    maxBuffer: 1024 * 1024,
  })
}

const listed = runWrangler([
  'secret',
  'list',
  '--format',
  'json',
  '--config',
  'wrangler.toml',
])

if (listed.status !== 0) {
  console.error('Could not inspect Otya core secrets before deployment.')
  if (listed.stderr?.trim()) console.error(listed.stderr.trim())
  process.exit(1)
}

let secrets
try {
  secrets = JSON.parse(listed.stdout || '[]')
} catch {
  console.error('Wrangler returned an unreadable secret inventory.')
  process.exit(1)
}

if (Array.isArray(secrets) && secrets.some(secret => secret?.name === 'ADMIN_SESSION_SECRET')) {
  console.log('Admin session signing secret is configured.')
  process.exit(0)
}

// Bootstrap exactly once when the dedicated secret is absent. The generated
// value is sent to Wrangler only through stdin and is never printed or stored
// in the repository or GitHub Actions environment.
const generated = randomBytes(48).toString('base64url')
const created = runWrangler([
  'secret',
  'put',
  'ADMIN_SESSION_SECRET',
  '--config',
  'wrangler.toml',
], `${generated}\n`)

if (created.status !== 0) {
  console.error('Could not create the Otya Admin session signing secret.')
  if (created.stderr?.trim()) console.error(created.stderr.trim())
  process.exit(1)
}

console.log('Admin session signing secret was securely bootstrapped.')
