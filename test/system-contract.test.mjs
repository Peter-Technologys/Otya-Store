import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('Admin browser session stays cookie-based and URL-safe', () => {
  const source = read('src/lib/admin_auth.ts')
  assert.match(source, /HttpOnly/)
  assert.match(source, /Secure/)
  assert.match(source, /SameSite=Strict/)
  assert.match(source, /Max-Age=/)
  assert.doesNotMatch(source, /searchParams\.get\([^)]*token/i)
  assert.doesNotMatch(source, /queryParameters[^\n]*token/i)
})

test('Interactive admin APIs require the elevated MFA session', () => {
  const routes = [
    'src/app/api/admin/stats/route.ts',
    'src/app/api/admin/themes/route.ts',
    'src/app/api/admin/crashes/route.ts',
    'src/app/api/admin/feedback/route.ts',
    'src/app/api/admin/release/route.ts',
    'src/app/api/admin/app-config/route.ts',
    'src/app/api/push/route.ts',
    'src/app/api/notifications/reengage/route.ts',
    'src/app/api/blog/route.ts',
  ]
  for (const path of routes) {
    const source = read(path)
    assert.match(source, /verifyAdminSession/, `${path} must verify the elevated admin session`)
    assert.doesNotMatch(source, /isAdminAuthorized/, `${path} must not use legacy compatibility auth`)
    assert.doesNotMatch(source, /ADMIN_TOKEN/, `${path} must not accept ADMIN_TOKEN directly`)
  }
})

test('Worker-level admin AI and release workflow require elevated admin verification', () => {
  const source = read('src/entrypoint.mjs')
  assert.match(source, /hasElevatedAdminSession/)
  assert.match(source, /Elevated administrator verification required/)
  assert.match(source, /ACCESS_COOKIE = '__Host-otya_access'/)
  assert.match(source, /ADMIN_COOKIE = 'otya_admin_session'/)
  assert.match(source, /authorizeReleaseWorkflow/)
})

test('Admin MFA OTPs are format-checked, single-use, and hashed at rest', () => {
  const source = read('auth-worker/src/admin-mfa.ts')
  assert.match(source, /\^\[A-Z\]\[0-9\]\{4\}\$/)
  assert.match(source, /crypto\.subtle\.digest\('SHA-256'/)
  assert.match(source, /otpDigest\(user\.id, otp\)/)
  assert.match(source, /timingSafeEqual\(suppliedDigest, storedDigest\)/)
  assert.match(source, /delete\(`admin_mfa_otp:\$\{user\.id\}`\)/)
  assert.doesNotMatch(source, /put\(`admin_mfa_otp:\$\{user\.id\}`, otp,/)
})

test('OTYA one-time codes and public IDs use unbiased random allocation', () => {
  const crypto = read('auth-worker/src/crypto.ts')
  const db = read('auth-worker/src/db.ts')

  assert.match(crypto, /randomBelow/)
  assert.match(crypto, /randomBelow\(10_000\)/)
  assert.doesNotMatch(crypto, /%\s*10000/)

  assert.match(db, /randomBelow\(100_000_000\)/)
  assert.match(db, /`2IS\$\{randomBelow\(100_000_000\)/)
  assert.doesNotMatch(db, /\)\s*%\s*100000000/)
  assert.match(db, /CREATE UNIQUE INDEX IF NOT EXISTS idx_users_otya_id/)
})

test('OTYA public ID allocation retries collisions without exposing the internal UUID', () => {
  const db = read('auth-worker/src/db.ts')
  const account = read('src/app/account/page.tsx')

  assert.match(db, /for \(let attempt = 0; attempt < 16; attempt\+\+\)/)
  assert.match(db, /isUniqueConstraintError/)
  assert.match(account, /otya_id/)
  assert.doesNotMatch(account, /label=["']Account ID["'][^\n]*user\.id/)
})

test('Ask OTYA keeps a low-cost guest model and curated signed-in catalog', () => {
  const config = read('ai-worker/wrangler.toml')
  const chat = read('ai-worker/src/client-chat.mjs')

  assert.match(config, /AI_GUEST_MODEL = "llama-fast"/)
  assert.match(config, /AI_DEFAULT_MODEL = "otya-smart"/)

  const catalogLine = config.match(/^AI_PUBLIC_MODELS\s*=\s*"([^"]+)"$/m)
  assert.ok(catalogLine, 'AI_PUBLIC_MODELS must be present in ai-worker/wrangler.toml')
  const configuredModels = catalogLine[1].split(',').map(value => value.trim()).filter(Boolean)
  const expected = [
    'llama-fast',
    'otya-smart',
    'gemma-4',
    'granite',
    'llama-70b',
    'gpt-oss-20b',
    'gpt-oss-120b',
    'nemotron',
    'llama-4-scout',
    'qwen3',
    'sea-lion',
  ]
  for (const id of expected) assert.ok(configuredModels.includes(id), `${id} must remain in AI_PUBLIC_MODELS`)

  assert.match(chat, /if\(!signedIn\).*policy\.guest/)
  assert.match(chat, /friendly general-purpose AI assistant built into OTYA/)
  assert.match(chat, /Public Ask OTYA cannot see the private Admin Assistant/)
})

test('Free-plan OTYA catalog does not advertise paid-only GLM 5.3', () => {
  const config = read('ai-worker/wrangler.toml')
  const chat = read('ai-worker/src/client-chat.mjs')
  assert.doesNotMatch(config, /glm-5\.3/i)
  assert.doesNotMatch(chat, /glm-5\.3/i)
})

test('Cloudflare remains the public release and AI control plane', () => {
  const chat = read('ai-worker/src/client-chat.mjs')
  assert.match(chat, /Official website:/)
  assert.match(chat, /\/latest/)
  assert.match(chat, /Local playback, media scanning, local search and supported local transfer must keep working/)
  assert.match(chat, /without signing in, Firebase, Jamendo or AI/)
  assert.match(chat, /local Search are primary; online music and AI are optional enhancements/)
})

test('new client capabilities stay synchronized across the control plane', () => {
  const clientConfig = read('src/lib/client_config.ts')
  const appConfig = read('src/app/api/app-config/route.ts')

  assert.match(clientConfig, /'onlineMusic'/)
  assert.match(appConfig, /onlineMusic:\s*true/)
  assert.match(appConfig, /providerPriority:\s*\['local',\s*'help',\s*'online'\]/)
  assert.match(appConfig, /ai:\s*'https:\/\/petersmartlink\.com\/ask'/)
  assert.doesNotMatch(appConfig, /action:\s*'\/myspace'/)
})

test('Jamendo credentials remain server-side and linked-account tokens are encrypted at rest', () => {
  const catalog = read('src/app/api/music/jamendo/route.ts')
  const callback = read('src/app/api/music/jamendo/oauth/callback/route.ts')

  assert.match(catalog, /JAMENDO_CLIENT_ID/)
  assert.doesNotMatch(catalog, /JAMENDO_CLIENT_SECRET/)
  assert.match(callback, /JAMENDO_CLIENT_SECRET/)
  assert.match(callback, /AES-GCM/)
  assert.match(callback, /crypto\.subtle\.encrypt/)
  assert.match(callback, /const encrypted = await encryptTokenRecord\(record, clientSecret\)/)
  assert.match(callback, /kv\.put\(`jamendo:account:\$\{accountKey\}`, encrypted\)/)
  assert.doesNotMatch(callback, /kv\.put\(`jamendo:account:\$\{accountKey\}`, JSON\.stringify\(record\)\)/)
})

test('Jamendo catalog never exposes a download action unless provider permission and URL are both valid', () => {
  const catalog = read('src/app/api/music/jamendo/route.ts')
  assert.match(catalog, /audiodownload_allowed/)
  assert.match(catalog, /downloadAllowed/)
  assert.match(catalog, /downloadUrl/)
})
