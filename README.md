# OTYA Backend — API, Authentication & Distribution

The backend infrastructure of the **OTYA System**, serving OTYA Player and system services. It provides authentication integration, application APIs, cloud sync, APK distribution, administration, notifications, and supporting platform services.

**Live at:** https://petersmartlink.com

## OTYA System architecture

- **OTYA Player** — the client application.
- **OTYA Auth** — the authentication Worker. OTP is an authentication feature, not a separate service.
- **OTYA Backend** — the main backend Worker and platform API.

## What OTYA Backend does

- **Authentication integration** — communicates with OTYA Auth through the Cloudflare Service Binding.
- **App sync** — device registration, FCM tokens, EQ presets, playlists, and history.
- **APK distribution** — R2-backed release streaming with rate limiting and analytics.
- **Update checker** — version comparison for in-app update prompts.
- **Push notifications** — FCM delivery and re-engagement processing.
- **Pro subscriptions** — expiry management and payment webhook processing where enabled.
- **Administration** — release management and platform statistics.
- **Blog/CMS** — application news and updates.

## Public endpoints

| Route | Description |
|---|---|
| `GET /` | Redirects to the download page |
| `GET /version` | Current version information |
| `GET /latest` | Version and download links JSON |
| `GET /download` | Detects device ABI and redirects to APK |
| `GET /apk/arm64` | Streams the arm64 APK from R2 |
| `GET /apk/arm32` | Streams the arm32 APK from R2 |
| `GET /stats` | Download analytics from D1 |

## Cloudflare resources

| Binding | Type | Resource | Purpose |
|---|---|---|---|
| `R2` | R2 Bucket | `otya-player-releases` | OTYA Player release storage |
| `KV` | KV Namespace | `otya-store-kv` | Version/cache data |
| `DB` | D1 Database | `otya-store-db` | Backend analytics and version data |
| `RATE_LIMITER` | Rate Limit | — | Download/API protection |
| `AUTH` | Service Binding | `otya-auth` | Authentication service |

Email sending should use the server-side Resend integration where configured. Do not add Resend credentials to source code or the Flutter client.

## R2 release structure

Bucket: `otya-player-releases`

```text
version.json
releases/
  v1.0.0/
    otya-player-v1.0.0-arm64.apk
    otya-player-v1.0.0-arm32.apk
```

## Development and deployment

`otya-next` is the development branch. `main` is the stable branch.

Changes should be tested on `otya-next`, reviewed, and then merged into `main` before production deployment.

### Required Cloudflare credentials

Cloudflare credentials belong in GitHub/Cloudflare secret storage and must never be committed.

### Manual deployment

```bash
npm install
npm run deploy
```

## Security

- Keep authentication secrets and provider API keys in Worker secrets.
- Never expose Resend or Cloudflare credentials to OTYA Player.
- Validate and authenticate backend requests before accessing protected data.
- Do not remove production bindings or databases without verifying dependencies first.
