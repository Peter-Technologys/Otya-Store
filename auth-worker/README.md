# OTYA Auth — Cloudflare Worker

Authentication service for **OTYA System**. It powers account registration, login, Google sign-in, email verification, password recovery, JWT issuance, and account lifecycle operations for OTYA products such as OTYA Player.

## Setup

### 1. Create D1 database

```sh
wrangler d1 create otya-auth-db
# Copy the database_id into wrangler.toml
```

### 2. Create KV namespace

```sh
wrangler kv namespace create AUTH_KV
# Copy the id into wrangler.toml
```

### 3. Apply schema

```sh
wrangler d1 execute otya-auth-db --file=schema.sql
```

### 4. Set secrets

```sh
wrangler secret put AUTH_JWT_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put RESEND_API_KEY
```

`RESEND_API_KEY` is a server-side secret. Never place it in Flutter, source code, GitHub, Wrangler `vars`, or client-visible configuration. Cloudflare recommends Worker secrets for sensitive API keys. urlCloudflare Workers secrets documentationhttps://developers.cloudflare.com/workers/configuration/secrets/

### 5. Email provider

OTYA System uses **Resend** for transactional email. The migration away from the legacy Cloudflare `EMAIL` binding must be completed and tested before the old binding is removed from the Worker.

Required transactional flows:

- Email verification OTP
- Welcome email
- Password-reset OTP
- New-device/security alert

### 6. Deploy

```sh
npm install
npm run deploy
```

### 7. Add Service Binding in the OTYA Backend

The main OTYA Backend Worker calls `otya-auth` through a Service Binding:

```toml
[[services]]
binding = "AUTH"
service = "otya-auth"
```

## API

All endpoints return `{ error: string }` on failure.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | None | Email + password signup |
| POST | `/auth/login` | None | Email + password login |
| POST | `/auth/refresh` | Refresh token | Issue a new access token |
| POST | `/auth/logout` | Refresh token | Revoke refresh token |
| POST | `/auth/google` | Google token | Google OAuth login/signup |
| POST | `/auth/forgot-password` | None | Send password-reset OTP |
| POST | `/auth/reset-password` | OTP | Reset password with OTP |
| POST | `/auth/send-verification` | Bearer JWT | Send email verification OTP |
| POST | `/auth/verify-email` | Bearer JWT | Verify email using OTP |
| POST | `/auth/delete-account` | Bearer JWT | Delete account and revoke tokens |
| GET | `/auth/verify` | Bearer JWT | Validate JWT for OTYA Backend |
| GET | `/auth/me` | Bearer JWT | Return current user |
| PATCH | `/auth/me` | Bearer JWT | Update profile |
| POST | `/auth/backup` | Bearer JWT | Write Google Drive backup |
| GET | `/auth/backup` | Bearer JWT | Read Google Drive backup |
| DELETE | `/auth/backup` | Bearer JWT | Delete Google Drive backup |

## Token and OTP contract

- **Access token:** HS256 JWT, 15-minute TTL. Payload: `{ sub, email, iat, exp }`.
- **Refresh token:** 64-character random token stored in KV with a 30-day TTL.
- **Verification/password-reset OTP:** exactly **5 characters** matching `^[A-Z][0-9]{4}$` — for example `A1234`.
- OTPs are stored in KV and expire after 10 minutes.
- OTPs must be single-use and rate-limited.

## Branding

Product-facing identity is **OTYA System**.

- Platform: **OTYA System**
- Media product: **OTYA Player**
- Authentication service: **OTYA Auth**
- Backend service: **OTYA Backend**

`PeterSmart`/`PeterSmart Link` may remain where required for legal ownership, business contact, or domain ownership, but should not replace the OTYA product identity in user-facing authentication flows.
