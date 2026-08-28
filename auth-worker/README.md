# OTYA Auth — Cloudflare Worker

Authentication service for **OTYA**. It powers one shared OTYA account for registration, login, Google sign-in, email verification, password recovery, optional phone verification, linked identities, JWT issuance, consent and account lifecycle operations across OTYA products.

## Architecture

OTYA Auth owns identity and security only. Product-specific data stays in each product backend and is keyed by the same stable OTYA `user_id`.

- One OTYA account can be reused across OTYA products.
- Products must not automatically receive one another's private data.
- New products should verify the OTYA JWT and use `sub` as the shared account ID.
- Product permissions and product data remain separately scoped.
- Phone numbers and recovery details are optional account-security information, not a requirement for local OTYA Player playback.

## Setup

### Core resources

Create/bind the existing production D1 database and AUTH_KV namespace, then apply `schema.sql` for a new environment. Production deployments use the IDs in `wrangler.toml`.

### Required secrets

```sh
wrangler secret put AUTH_JWT_SECRET
wrangler secret put RESEND_API_KEY
```

Google identity uses the configured `GOOGLE_CLIENT_ID` variable. Sensitive values must remain server-side.

### Optional Telegram account verification

OTYA supports two Telegram verification paths:

1. **Telegram Login / OIDC** — preferred. A signed-in OTYA user links a Telegram identity and, only when Telegram returns a verified phone claim with the user's consent, OTYA records that phone as verified.
2. **Telegram Gateway** — optional code fallback. OTYA asks Telegram Gateway to deliver a code to the Telegram account associated with a phone number and verifies the code server-side.

Configure BotFather's Login Widget/OIDC allowed URLs and use this callback:

```text
https://petersmartlink.com/auth/telegram/callback
```

Optional secrets:

```sh
wrangler secret put TELEGRAM_LOGIN_CLIENT_ID
wrangler secret put TELEGRAM_LOGIN_CLIENT_SECRET
wrangler secret put TELEGRAM_GATEWAY_TOKEN
```

Do not put any Telegram client secret or Gateway token in Flutter or browser code. Telegram linking is intentionally attached to an already authenticated OTYA account; it does not silently merge or create accounts by phone number.

## Email provider

OTYA uses **Resend** for transactional account email, including verification, password reset, welcome and security alerts.

## API

All endpoints return `{ error: string }` on failure.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | None | Email + password signup with current legal consent |
| POST | `/auth/login` | None | Email + password login |
| POST | `/auth/refresh` | Refresh token | Issue a new access token |
| POST | `/auth/logout` | Refresh token | Revoke refresh token |
| POST | `/auth/google` | Google token | Google OAuth login/signup |
| POST | `/auth/forgot-password` | None | Send password-reset OTP |
| POST | `/auth/reset-password` | OTP | Reset password and revoke refresh sessions |
| POST | `/auth/send-verification` | Bearer JWT | Send email verification OTP |
| POST | `/auth/verify-email` | Bearer JWT | Verify email using OTP |
| GET | `/auth/account` | Bearer JWT | Rich account profile, identities and product memberships |
| PATCH | `/auth/account` | Bearer JWT | Update optional personal/recovery/locale profile fields |
| POST | `/auth/telegram/start` | Bearer JWT | Begin Telegram OIDC linking with PKCE |
| GET | `/auth/telegram/callback` | OIDC state/code | Verify and link Telegram identity/verified phone claim |
| POST | `/auth/phone/request` | Bearer JWT | Send optional Telegram Gateway verification code |
| POST | `/auth/phone/verify` | Bearer JWT | Verify Gateway code and save verified phone |
| POST | `/auth/delete-account` | Bearer JWT | Delete account and revoke tokens |
| GET | `/auth/verify` | Bearer JWT | Validate JWT for OTYA services |
| GET | `/auth/me` | Bearer JWT | Legacy/basic current account response |
| PATCH | `/auth/me` | Bearer JWT | Legacy/basic profile update |
| POST | `/auth/backup` | Bearer JWT | Write Google Drive backup |
| GET | `/auth/backup` | Bearer JWT | Read Google Drive backup |
| DELETE | `/auth/backup` | Bearer JWT | Delete Google Drive backup |

## Account information model

Minimal signup intentionally stays small: primary email, authentication credential, optional name, and required legal consent. Users can later add profile photo, verified phone, recovery email, country/region, locale and timezone. OTYA also records necessary security/account metadata such as verification timestamps, linked identity providers, product memberships and consent versions.

Do not collect date of birth, gender, physical address, national ID/passport data or precise location unless a future product has a clear documented need and appropriate privacy controls.

## Token and OTP contract

- **Access token:** HS256 JWT, 15-minute TTL. Payload: `{ sub, email, iat, exp }`.
- **Refresh token:** 64-character random token stored in KV with a 30-day TTL.
- **Email verification/password-reset OTP:** exactly **5 characters** matching `^[A-Z][0-9]{4}$`, for example `A1234`.
- Email OTPs are single-use and rate-limited.
- Telegram Gateway codes are verified by Telegram Gateway and are not treated as OTYA password credentials.

## Branding

Product-facing umbrella identity is **OTYA**. PeterSmart Link remains the legal/business/developer identity where required for ownership, contact, billing and legal disclosures.
