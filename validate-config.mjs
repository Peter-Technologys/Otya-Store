import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL(`./${path}`, import.meta.url), 'utf8')
const failures = []

function requireMatch(label, source, pattern) {
  if (!pattern.test(source)) failures.push(label)
}

function forbidMatch(label, source, pattern) {
  if (pattern.test(source)) failures.push(label)
}

const store = read('wrangler.toml')
const auth = read('auth-worker/wrangler.toml')
const ai = read('ai-worker/wrangler.toml')
const fcm = read('src/lib/fcm.ts')
const appCheck = read('src/lib/firebase_app_check.ts')
const googleWrapper = read('auth-worker/src/production-entrypoint.ts')
const jamendoCatalog = read('src/app/api/music/jamendo/route.ts')
const telegramProxy = read('src/app/api/auth/telegram/[...path]/route.ts')

requireMatch('otya-store Worker name', store, /^name\s*=\s*"otya-store"$/m)
for (const binding of ['R2', 'KV', 'DB', 'OTYA_ANALYTICS', 'RATE_LIMITER', 'PUSH_QUEUE', 'AI_QUEUE', 'AUTH', 'AI_SUPPORT', 'OTYA_RELEASE_WORKFLOW']) {
  requireMatch(`otya-store binding ${binding}`, store, new RegExp(`(?:binding|name)\\s*=\\s*"${binding}"`))
}
requireMatch('OTYA Analytics Engine dataset must be production-bound', store, /^dataset\s*=\s*"otya_system_analytics"$/m)
requireMatch('Firebase project id must be otya-player', store, /^FIREBASE_PROJECT_ID\s*=\s*"otya-player"$/m)
requireMatch('Firebase project number must be verified', store, /^FIREBASE_PROJECT_NUMBER\s*=\s*"82776565585"$/m)
requireMatch('Firebase Android app id must be verified', store, /^FIREBASE_ANDROID_APP_ID\s*=\s*"1:82776565585:android:085cf9b4eecb76e9535570"$/m)
requireMatch('Android package must be verified', store, /^ANDROID_PACKAGE_NAME\s*=\s*"com\.otyaplayer\.app"$/m)
requireMatch('App Check production mode must remain monitor', store, /^FIREBASE_APP_CHECK_MODE\s*=\s*"monitor"$/m)
forbidMatch('App Check must not be pinned to enforce in Wrangler', store, /^FIREBASE_APP_CHECK_MODE\s*=\s*"enforce"$/m)

requireMatch('otya-auth must use production wrapper', auth, /^main\s*=\s*"src\/production-entrypoint\.ts"$/m)
requireMatch('Android Google client id must be verified', auth, /^GOOGLE_CLIENT_ID\s*=\s*"82776565585-77b1t8epvmn3mpdvstdg1rtprlju4suv\.apps\.googleusercontent\.com"$/m)
requireMatch('Web Google client id must be verified', auth, /^GOOGLE_WEB_CLIENT_ID\s*=\s*"82776565585-obr8k53b8n6djsggissv8qne81cm3u5u\.apps\.googleusercontent\.com"$/m)
requireMatch('otya-auth Firebase project id', auth, /^FIREBASE_PROJECT_ID\s*=\s*"otya-player"$/m)
requireMatch('Telegram redirect must match live canonical API callback', auth, /^TELEGRAM_LOGIN_REDIRECT_URI\s*=\s*"https:\/\/petersmartlink\.com\/api\/auth\/telegram\/callback"$/m)
requireMatch('Telegram public callback must proxy to private auth service', telegramProxy, /PUBLIC_PREFIX\s*=\s*'\/api\/auth\/telegram\/'/)
requireMatch('Telegram public callback must preserve private auth route', telegramProxy, /AUTH_PREFIX\s*=\s*'\/auth\/telegram\/'/)
requireMatch('Telegram public callback must use AUTH binding', telegramProxy, /\.AUTH as AuthService/)
forbidMatch('Cloudflare EMAIL binding must not return to auth Wrangler', auth, /\[\[send_email\]\]|binding\s*=\s*"EMAIL"/i)
requireMatch('production Google wrapper must support web audience', googleWrapper, /GOOGLE_WEB_CLIENT_ID/)
requireMatch('production Google wrapper must reject unconfigured audiences', googleWrapper, /configuredGoogleAudiences/)

requireMatch('otya-ai Worker name', ai, /^name\s*=\s*"otya-ai"$/m)
requireMatch('otya-ai push queue binding', ai, /binding\s*=\s*"PUSH_QUEUE"/)
requireMatch('otya-ai guest model remains low-cost default', ai, /^AI_GUEST_MODEL\s*=\s*"llama-fast"$/m)

requireMatch('FCM must use HTTP v1', fcm, /https:\/\/fcm\.googleapis\.com\/v1\/projects\/\$\{projectId\}\/messages:send/)
forbidMatch('Legacy FCM endpoint is forbidden', fcm, /fcm\.googleapis\.com\/fcm\/send/)
requireMatch('App Check implementation must support monitor/enforce switch', appCheck, /FIREBASE_APP_CHECK_MODE/)

// Jamendo public catalog is intentionally read-only. It may use the app Client
// ID, but the Client Secret belongs only in the future server-side OAuth grant
// and refresh exchange after a user explicitly chooses to connect Jamendo.
requireMatch('Jamendo catalog must use Cloudflare runtime context', jamendoCatalog, /getCloudflareContext/)
requireMatch('Jamendo catalog must read JAMENDO_CLIENT_ID', jamendoCatalog, /JAMENDO_CLIENT_ID/)
forbidMatch('Jamendo Client Secret must never enter public catalog code', jamendoCatalog, /JAMENDO_CLIENT_SECRET/)
forbidMatch('Jamendo credentials must not be hard-coded in public catalog code', jamendoCatalog, /3bb1fe8d|606b6f72bdd754bcbacaddd50c8b2e19/)

const scanned = [store, auth, ai, fcm, appCheck, googleWrapper, jamendoCatalog, telegramProxy].join('\n')
forbidMatch('Firebase Admin private key material must not be committed', scanned, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/)
forbidMatch('Resend API key values must not be committed', scanned, /\bre_[A-Za-z0-9_-]{20,}\b/)

if (failures.length) {
  console.error('OTYA production configuration validation failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('OTYA production configuration validation passed.')
