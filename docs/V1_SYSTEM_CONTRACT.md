# OTYA v1 Server Contract

OTYA v1 is one product. The website, API, auth, Ask OTYA and Admin must share clear boundaries instead of acting like separate products.

## Single owners

- Public product/backend API: one OTYA API contract.
- Identity/security: OTYA Auth only.
- Email/password, OTP and account email: OTYA Auth + Resend.
- Public assistant: Ask OTYA only.
- Human support: one ticket/email handoff path.
- Admin operations: one private OTYA Admin surface.
- Push business logic: OTYA backend; FCM is transport only.
- Remote config/releases/feature metadata: one Cloudflare config/release contract, with approved Firebase-owned client presentation parameters composed behind it.
- Storage: D1 for relational records, KV for cache/config where appropriate, R2 for objects/releases, Queues for async work where justified.

## Public product rules

The public website presents one product: OTYA. Ask OTYA is available through the product/support experience. Account is a supporting security/recovery surface, not a separate product. Admin AI is private and never exposed through public Ask OTYA permissions.

## AI rules

Ask OTYA is a friendly general-purpose assistant with extra OTYA context. Guests remain server-limited to the configured low-cost guest model; signed-in users may receive the curated model selector and persistent conversations according to server policy. Keep abuse/rate protection and Cloudflare quota awareness. Human-required requests can create a support handoff. Never expose secrets, OTPs, refresh tokens, customer lists, service-account credentials or private Admin AI tools to public Ask OTYA.

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

Firebase App Check uses Play Integrity for release builds. Backend mode remains `monitor` until signed production metrics justify enforcement. Local/offline media behavior must never depend on Firebase/App Check availability.

FCM uses the HTTP v1 API with short-lived Google OAuth access tokens. Firebase Admin/service-account JSON is server-only secret material and must never be committed or placed in the Android app.

## Email contract

There is no production Cloudflare EMAIL binding. Legacy auth handlers are wrapped by the production entrypoint with a Resend adapter, and known account messages may use published Resend templates with a safe HTML/text fallback. Required provider credentials stay in Cloudflare/GitHub secret storage only.

## Offline boundary

Backend/auth/AI/Firebase/Resend outages must not stop Android startup, local scanning, playback, local transfer or local tools.

## Configuration safety

`validate-config.mjs` is a deployment gate. It pins the verified Firebase identifiers, required Worker/service bindings, FCM HTTP v1, App Check monitor mode, approved OAuth clients and secret-material rules. Public Firebase identifiers belong in reviewed configuration; secret credentials do not.

Wrangler remains the reviewed declaration for `otya-store`, `otya-auth` and `otya-ai`, but production must still be compared against live Cloudflare before release. Do not create duplicate D1/KV/R2/Queue resources as a shortcut for a mismatch.

## No placeholders

Do not publish Coming Soon, dead links, fake product cards or nonfunctional admin controls. A visible action must have a working endpoint and handled error state.

## Free-first rule

Prefer free-tier-capable infrastructure while it remains technically reliable: Cloudflare Workers/D1/KV/R2/Queues/AI within current allocations, Resend free allowance, and Firebase services used within applicable free quotas. Do not silently introduce a paid dependency.

## Release and deployment gate

Pull requests validate only. Production Worker deployment is permitted only from a validated push to `main`; the app's official release objects are published only through the separately gated release/tag process. Never use ordinary CI success to overwrite canonical R2 release artifacts.

Do not merge the v1 rebuild until all applicable gates are green, including website build, auth/Resend, Google/Firebase identity, FCM, App Check monitor behavior, Ask OTYA, Admin authorization, config/release endpoints, device registration, security checks, Cloudflare deployment validation, mobile/desktop website behavior and Android real-device acceptance. External CI/runner or console failures are blockers, not reasons to weaken these checks.
