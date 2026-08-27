# OTYA Store / Backend Security Policy

## Reporting

Do not publish production secrets, API keys, JWTs, refresh tokens, OTPs, Cloudflare credentials, Resend credentials, Google tokens, signing material, private user data or exploitable authentication details in public issues.

Use a private GitHub security advisory when available, or the official support/contact channel published on `petersmartlink.com`.

## Security-sensitive components

Extra review is required for:
- `otya-auth` authentication and session logic;
- password hashing, OTP and reset flows;
- Google token verification and Drive recovery proxy logic;
- Resend/email adapters;
- D1/KV/R2 access and migrations;
- queues, scheduled jobs and release workflows;
- Cloudflare bindings, routes and Wrangler configuration;
- admin endpoints and authorization;
- GitHub Actions deployment/release changes.

## Secret handling

Secret values must never be committed to this repository. Use GitHub Actions secrets and Cloudflare secret storage. Public/client configuration may be committed only when it is intentionally non-secret, such as a Google OAuth client ID.

Logs must not contain authorization headers, JWTs, refresh tokens, OTPs, Google access tokens or provider API keys.

## Production change safety

GitHub Actions remains the deployment source of truth. Database migrations should preserve data/schema compatibility and be reversible where practical. Never delete production D1/KV/R2 data as part of an ordinary deployment.
