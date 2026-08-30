# OTYA v1 Server Contract

OTYA v1 is one product. The Android app, website, API, auth, Ask OTYA, Admin, notifications, email and provider integrations must share clear boundaries instead of acting like separate products.

## Single owners

- Public product/backend API: one OTYA API contract.
- Identity/security: OTYA Auth only.
- Email/password, OTP and account email: OTYA Auth + Resend.
- Public assistant: Ask OTYA only.
- Human support: one ticket/email handoff path.
- Admin operations: one private OTYA Admin/Command Center surface.
- Push business logic: OTYA backend; FCM is transport only.
- Remote config/releases/feature metadata: one Cloudflare config/release contract, with approved Firebase-owned client presentation parameters composed behind it.
- Online music provider access: OTYA backend is the provider boundary; the Android UI never owns Jamendo secrets or OAuth token exchange.
- Storage: D1 for relational records, KV for cache/config where appropriate, R2 for objects/releases, Queues for async work where justified.

## Public product rules

The public website presents one product: OTYA. Ask OTYA is available at `/ask` and through appropriate product/support entry points. Account is a supporting security/recovery surface, not a separate product. Admin AI is private and never exposed through public Ask OTYA permissions.

Android keeps only three permanent top-level destinations: Video, Music and Me. Deeper functions are contextual or organized under those destinations. Do not create duplicate top-level entries for utilities that already belong in a player, media-item action, Tools or Settings.

## Offline-first product contract

OTYA is an offline-first media player. Internet access enhances the product but never defines it.

- App startup, local scanning, local Search, local playback, playlists, downloaded media, Private, supported local Transfer and local tools must remain usable without internet, OTYA sign-in, Firebase, Jamendo, Ask OTYA or Resend.
- Global Search computes local results first. Optional provider results may be added afterward only when available.
- Cloud/backend failures must degrade optional online surfaces quietly and must not replace local results with a global error state.
- Remote config is loaded after the first frame and may use cached values. Network configuration refresh must not block startup.

## Online music contract

Online music is an enhancement inside Music/Search, not a separate streaming-app identity.

- Provider 1 is Jamendo behind the OTYA `/api/music/jamendo` gateway.
- Normal public catalog/search/playback uses only `JAMENDO_CLIENT_ID`; `JAMENDO_CLIENT_SECRET` must never be used by or returned from the public catalog route.
- OTYA users do not need a Jamendo account to browse or listen to the public catalog.
- OTYA account identity and Jamendo identity remain separate. Optional Jamendo account linking requires explicit user OAuth consent.
- Jamendo OAuth uses the registered HTTPS callback, cryptographically random one-time state, strict state verification and immediate server-side code exchange. Reusable access/refresh tokens must be encrypted at rest before KV storage.
- A Download action is exposed only when the provider says downloading is allowed and a valid provider download URL is present. Non-downloadable tracks must not show a disabled or misleading Download button.
- Downloaded tracks become ordinary local media and should appear through the normal Music library after Android media indexing/scanning.
- `onlineMusic` is an optional remotely controlled client feature. Turning it off must leave local Music/Search/playback unchanged.
- Search provider priority is `local -> help -> online`; online enrichment never outranks local results.

## AI rules

Ask OTYA is a friendly general-purpose assistant with extra OTYA context. Guests remain server-limited to the configured low-cost guest model; signed-in users may receive the curated model selector and persistent conversations according to server policy. Keep abuse/rate protection and Cloudflare quota awareness. Human-required requests can create a support handoff. Never expose secrets, OTPs, refresh tokens, customer lists, service-account credentials or private Admin AI tools to public Ask OTYA.

Ask OTYA product knowledge must stay synchronized with current OTYA behavior. For Online Music it must understand that OTYA is still offline-first, Jamendo login is optional, provider outages do not disable local music, and Download is available only for provider-authorized tracks. It must never claim it performed a device/account/provider action unless the backend actually confirms that action.

## Firebase and Google identity contract

Cloudflare remains the OTYA control plane and canonical account/session authority. Firebase is not a second database/backend for v1.

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

Playback notifications are system media-session controls, not ordinary marketing notifications. Local and online audio use the same Now Playing path with artwork/title/artist and headset/lock-screen controls. Playback must not trigger an ordinary notification permission prompt merely because the user pressed Play.

Non-media notifications are categorized and purposeful: downloads/transfers, account/security, support/system notices and updates. Online catalog availability alone must not generate push spam.

## Email contract

There is no production Cloudflare EMAIL binding. Legacy auth handlers are wrapped by the production entrypoint with a Resend adapter, and known account messages use the published OTYA Resend templates with a safe HTML/text fallback. Required provider credentials stay in Cloudflare/GitHub secret storage only.

Current core templates are Verification Code, Password Reset, Welcome, Security Alert and Service Notice. Template aliases and backend selection logic must remain synchronized. Email/provider failure should not expose secrets or raw provider payloads to users.

## Configuration safety

`validate-config.mjs` and system-contract tests are deployment gates. They pin the verified Firebase identifiers, required Worker/service bindings, FCM HTTP v1, App Check monitor mode, approved OAuth clients, feature/route synchronization and secret-material rules.

Client-facing feature names added to OTYA must be carried through the approved control-plane allowlist and default config in the same change. Stale public routes such as legacy `/myspace` or old AI links must not reappear in canonical configuration.

Firebase Remote Config owns only approved client presentation/experiment values. It cannot override Cloudflare-owned maintenance, release safety, auth/session authority, secret material, App Check enforcement policy or push infrastructure.

Wrangler remains the reviewed declaration for `otya-store`, `otya-auth` and `otya-ai`, but production must still be compared against live Cloudflare before release. Do not create duplicate D1/KV/R2/Queue resources as a shortcut for a mismatch.

## Async reliability and observability

Every promise that affects a correct response must be awaited. Non-critical work that must reliably complete after the response should use the Cloudflare execution context or an appropriate Queue/Workflow rather than a floating promise. Retryable account/email/support/background work should not be silently lost.

Production Workers keep logs/traces enabled. Logs must be useful for diagnosing auth, AI, provider, email and release failures without logging passwords, OTPs, tokens, API keys, service-account JSON or decrypted provider credentials.

## No placeholders

Do not publish Coming Soon, dead links, fake product cards or nonfunctional admin controls. A visible action must have a working endpoint and handled loading/error/empty state.

## Free-first rule

Prefer free-tier-capable infrastructure while it remains technically reliable: Cloudflare Workers/D1/KV/R2/Queues/AI within current allocations, Resend free allowance, Firebase services used within applicable free quotas, and Jamendo under the applicable approved non-commercial developer plan. Do not silently introduce a paid dependency.

## Release and deployment gate

Pull requests validate only. Production Worker deployment is permitted only from a validated push to `main`; the app's official release objects are published only through the separately gated release/tag process. Never use ordinary CI success to overwrite canonical R2 release artifacts.

Do not merge the Android v1 rebuild until all applicable app gates are green, including zero analyzer issues, tests, Android compile, signed release build and real-device acceptance. The backend may deploy independently when its exact head passes website/store/auth/AI/security validation and the production resource/binding/secret contract is known safe.
