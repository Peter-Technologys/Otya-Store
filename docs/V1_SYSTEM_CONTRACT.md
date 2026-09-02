# Otya v1 Server Contract

Otya v1 is one product. The Android app, website, API, auth, Next, Admin, notifications and email must share clear boundaries instead of acting like separate products.

## Single owners

- Public product/backend API: one Otya API contract.
- Identity/security: `otya-auth` only.
- Email/password, OTP and account email: Otya Auth + Resend.
- Public assistant: Next only.
- Human support: one ticket/email handoff path.
- Admin operations: one private Otya Admin/Command Center surface.
- Push business logic: Otya backend; FCM is transport only.
- Remote config/releases/feature metadata: one Cloudflare config/release contract, with approved Firebase-owned client presentation parameters composed behind it.
- Storage: D1 for relational records, KV for cache/config where appropriate, R2 for objects/releases, Queues for async work where justified.

## Public product rules

The public website presents one product: Otya. Next is available at `/ask` and through appropriate product/support entry points. Account is a supporting security/recovery surface, not a separate product. Admin AI is private and never exposed through public Next permissions.

Android keeps only three permanent top-level destinations: Video, Music and Me. Deeper functions are contextual or organized under those destinations. Do not create duplicate top-level entries for utilities that already belong in a player, media-item action, Tools or Settings.

## Offline-first product contract

Otya is an offline-first media player. Internet access enhances selected services but never defines local media playback.

- App startup, local scanning, local Search, local playback, playlists, downloaded media, Private, supported local Transfer and local tools must remain usable without internet, Otya sign-in, Firebase, Next or Resend.
- Global Search computes local results on-device and must not contact a music catalog while the user types.
- Cloud/backend failures must degrade optional online services quietly and must not replace local media results with a global error state.
- Remote config is loaded after the first frame and may use cached values. Network configuration refresh must not block startup.

## Music contract

Music is a local-library product surface, not a built-in streaming catalog.

- Otya Music covers local songs, albums, artists, folders, playlists and supported background playback.
- The retired Online Music/Jamendo catalog, OAuth, status and download-proxy routes must remain absent from production code.
- `onlineMusic` must not exist as an enabled client feature and cannot be restored through Firebase Remote Config or stale Cloudflare KV configuration.
- Search provider priority for product search is `local -> help`; there is no online music provider stage.
- `/music` on the website explains the local Android Music experience and must not fetch or proxy remote tracks.
- The legacy `/docs/online-music` route may redirect to the current Music page so old links fail safely instead of advertising a retired feature.
- Telegram `/music` is informational only and must not invoke a remote music-provider search.
- A future music provider is not part of v1. Reintroducing one requires a separate reviewed product/security/privacy contract and verified catalog/rights suitability; it must not be silently re-enabled through config.

## AI rules

Next is a friendly general-purpose assistant with extra Otya context. Guests remain server-limited to the configured low-cost guest model; signed-in users may receive approved model behavior according to server policy. Keep abuse/rate protection and Cloudflare quota awareness. Human-required requests can create a support handoff. Never expose secrets, OTPs, refresh tokens, customer lists, service-account credentials or private Admin AI tools to public Next.

Next product knowledge must stay synchronized with current Otya behavior. It must describe Music as local-first and must not recommend or claim a built-in Online Music/Jamendo catalog. It must never claim it performed a device/account/provider action unless the backend actually confirms that action.

## Firebase and Google identity contract

Cloudflare remains the Otya control plane and canonical account/session authority. Firebase is not a second database/backend for v1.

Verified production client identity:

- Firebase project ID: `otya-player`
- Firebase project number / FCM sender: `82776565585`
- Firebase Android app ID: `1:82776565585:android:085cf9b4eecb76e9535570`
- Android package: `com.otyaplayer.app`
- Android OAuth client: `82776565585-77b1t8epvmn3mpdvstdg1rtprlju4suv.apps.googleusercontent.com`
- Web OAuth client: `82776565585-obr8k53b8n6djsggissv8qne81cm3u5u.apps.googleusercontent.com`

The Android OAuth client remains registered against package/signing identity. The Android app uses the Web OAuth client as Google `serverClientId`, and `otya-auth` accepts only those explicitly configured Google audiences while still checking issuer, expiry and verified email.

Firebase App Check uses Play Integrity for release builds. Backend mode remains `monitor` until signed production metrics justify enforcement. Local/offline media behavior must never depend on Firebase/App Check availability. Custom backend App Check verification must validate issuer, audience, app identity, expiry and signature, and must tolerate normal Firebase signing-key rotation by refreshing JWKS safely.

FCM uses the HTTP v1 API with short-lived Google OAuth access tokens. Firebase Admin/service-account JSON is server-only secret material and must never be committed or placed in the Android app.

## Notification contract

Playback notifications are system media-session controls, not ordinary marketing notifications. Local audio uses the same Now Playing path with artwork/title/artist and headset/lock-screen controls. Playback must not trigger an ordinary notification permission prompt merely because the user pressed Play.

Non-media notifications are categorized and purposeful: downloads/transfers, account/security, support/system notices and updates. Removed provider/catalog availability must not generate push traffic.

## Email contract

There is no production Cloudflare EMAIL binding. Legacy auth handlers are wrapped by the production entrypoint with Resend delivery, and known account messages use the published Otya Resend templates with a safe HTML/text fallback. Required credentials stay in Cloudflare/GitHub secret storage only.

Current core templates are Verification Code, Password Reset, Welcome, Security Alert and Service Notice. Template aliases and backend selection logic must remain synchronized. Email/provider failure should not expose secrets or raw provider payloads to users.

## Configuration safety

`validate-config.mjs` and system-contract tests are deployment gates. They pin verified Firebase identifiers, required Worker/service bindings, FCM HTTP v1, App Check monitor mode, approved OAuth clients, feature/route synchronization and secret-material rules.

Client-facing feature names added to Otya must be carried through the approved control-plane allowlist and default config in the same change. Removed features must be deleted from that allowlist so stale Firebase or KV state cannot revive them. Stale public routes such as legacy `/myspace` or old AI links must not reappear in canonical configuration.

Firebase Remote Config owns only approved client presentation/experiment values. It cannot override Cloudflare-owned maintenance, release safety, auth/session authority, secret material, App Check enforcement policy or push infrastructure.

Wrangler remains the reviewed declaration for the Otya Workers, but production must still be compared against live Cloudflare before release. Do not create duplicate D1/KV/R2/Queue resources as a shortcut for a mismatch.

## Transfer security contract

Otya Transfer is a same-LAN feature, not a general-purpose downloader or public HTTP server.

- Cleartext HTTP is permitted only for authenticated transfer links on loopback/private IPv4 ranges because nearby devices use changing LAN addresses.
- Internet-facing Otya services remain HTTPS.
- Sender links use a cryptographically random one-time token and serve only supported audio/video extensions.
- Receiver links must contain the expected `/media` path and a valid token and must resolve to an allowed local/private IPv4 address.
- Transfer receivers must refuse redirects, require the Otya sender marker, accept only audio/video MIME types with a declared length, enforce a bounded maximum size and detect early/oversized streams.
- Transfer responses use `no-store` and anti-content-sniffing headers.
- Received content is never treated as executable code; unsupported file extensions are rejected before storage.

## Async reliability and observability

Every promise that affects a correct response must be awaited. Non-critical work that must reliably complete after the response should use the Cloudflare execution context or an appropriate Queue/Workflow rather than a floating promise. Retryable account/email/support/background work should not be silently lost.

Production Workers keep logs/traces enabled. Logs must be useful for diagnosing auth, AI, email, release and security failures without logging passwords, OTPs, tokens, API keys, service-account JSON or decrypted credentials.

## No placeholders

Do not publish Coming Soon, dead links, fake product cards or nonfunctional admin controls. A visible action must have a working endpoint and handled loading/error/empty state.

## Free-first rule

Prefer free-tier-capable infrastructure while it remains technically reliable: Cloudflare Workers/D1/KV/R2/Queues/AI within current allocations, Resend free allowance and Firebase services used within applicable free quotas. Do not silently introduce a paid dependency.

## Release and deployment gate

Pull requests validate only. Production Worker deployment is permitted only from a validated push to `main`; the app's official release objects are published only through the separately gated release/tag process. Never use ordinary CI success to overwrite canonical R2 release artifacts.

Do not merge the Android v1 rebuild until all applicable app gates are green, including zero analyzer issues, tests, Android compile, signed release build and real-device acceptance. The backend may deploy independently when its exact head passes website/auth/AI/security validation and the production resource/binding/secret contract is known safe.
