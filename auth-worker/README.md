# otya-auth — Cloudflare Worker

Standalone authentication worker for the Otya ecosystem. Handles user registration, login, Google OAuth, password reset, and JWT issuance.

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
wrangler secret put AUTH_JWT_SECRET   # strong random string, e.g. openssl rand -hex 32
wrangler secret put GOOGLE_CLIENT_ID  # from Google Cloud Console → OAuth 2.0 Client IDs
```

### 5. Add EMAIL binding (optional)

In Cloudflare Dashboard → Workers & Pages → `otya-auth` → Settings → Bindings → Add binding → Send Email.

### 6. Deploy

```sh
npm install
npm run deploy
```

### 7. Add Service Binding in otya-store

In `wrangler.toml` of the main otya-store project:

```toml
[[services]]
binding = "AUTH"
service = "otya-auth"
```

## API

All endpoints return `{ error: string }` on failure.

| Method | Path                    | Auth         | Description                          |
|--------|-------------------------|--------------|--------------------------------------|
| POST   | /auth/register          | None         | Email + password signup              |
| POST   | /auth/login             | None         | Email + password login               |
| POST   | /auth/refresh           | Refresh token| Issue new access token               |
| POST   | /auth/logout            | Refresh token| Revoke refresh token                 |
| POST   | /auth/google            | Google token | Google OAuth login/signup            |
| POST   | /auth/forgot-password   | None         | Send OTP to email                    |
| POST   | /auth/reset-password    | OTP          | Reset password with OTP              |
| POST   | /auth/delete-account    | Bearer JWT   | Delete account + revoke all tokens   |
| GET    | /auth/verify            | Bearer JWT   | Validate JWT (Service Binding only)  |

## Token format

- **Access token**: HS256 JWT, 15-minute TTL. Payload: `{ sub, email, iat, exp }`.
- **Refresh token**: 64-char hex string, stored in KV as `rt:{token}` → `user_id`, 30-day TTL.
- **OTP**: 6-digit numeric code, stored in KV as `otp:{email}`, 10-minute TTL.
