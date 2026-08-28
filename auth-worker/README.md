# OTYA Auth — Cloudflare Worker

Authentication service for **OTYA**. It powers one shared OTYA account for registration, login, Google sign-in, email verification, password recovery, JWT issuance, consent and account lifecycle operations across OTYA products such as OTYA Player and future OTYA apps.

## Architecture

OTYA Auth owns identity and security only. Product-specific data stays in each product backend and is keyed by the same stable OTYA `user_id`.

- One OTYA account can be reused across OTYA products.
- Products must not automatically receive one another's private data.
- New products should verify the OTYA JWT and use `sub` as the shared account ID.
- Product permissions and product data remain separately scoped.

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

`RESEND_API_KEY` is a server-side secret. Never place it in Flutter, source code, GitHub, Wrangler `vars`, or client-visible configuration.

### 5. Email provider

OTYA uses **Resend** for transactional account email.

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

The OTYA Backend calls `otya-auth` through a Service Binding:

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
| GET | `/auth/verify` | Bearer JWT | Validate JWT for OTYA services |
| GET | `/auth/me` | Bearer JWT | Return current OTYA account |
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

Product-facing umbrella identity is **OTYA**.

- Umbrella: **OTYA**
- Media product: **OTYA Player**
- AI: **OTYA AI**
- Authentication service: **OTYA Auth**
- Admin interface: **OTYA Console**
- Backend service: **OTYA Backend**

`PeterSmart Link` remains the legal/business/developer identity where required for ownership, contact, billing and legal disclosures.
