# OTYA Backend — API, Auth & Distribution

The complete backend for OTYA Player. Handles authentication, API, cloud sync, APK distribution, admin panel, blog, POS/business management, and push notifications. Built with Next.js (App Router) + TypeScript, deployed on Vercel. APK distribution via Cloudflare R2.

**Live at:** https://getotya.petersmartlink.com

## What this backend does
- **Auth** — JWT-based email/password + Google OAuth via `/auth/*` endpoints
- **App sync** — device registration, FCM tokens, EQ presets, playlists, history
- **APK distribution** — R2 bucket streaming with rate limiting and analytics
- **Update checker** — version comparison for in-app update prompts
- **Push notifications** — FCM re-engagement campaigns
- **Pro subscriptions** — expiry management and webhook payment processing
- **Admin panel** — release management, stats dashboard
- **Blog** — CMS for app news and updates
- **Group Receipts (GR)** — group-based receipt and transaction management
- **POS** — customers, products, sales, services, staff, inventory management

## Endpoints

| Route | Description |
|---|---|
| `GET /` | Redirects to download page |
| `GET /version` | Current version info (KV-cached, 5 min TTL) |
| `GET /latest` | Full version + download links JSON |
| `GET /download` | Auto-detects ABI, redirects to APK |
| `GET /apk/arm64` | Streams arm64 APK from R2 (rate-limited) |
| `GET /apk/arm32` | Streams arm32 APK from R2 (rate-limited) |
| `GET /stats` | Download analytics from D1 |

## Bindings

| Binding | Type | Resource | Purpose |
|---|---|---|---|
| `R2` | R2 Bucket | `otya-player-releases` | APK file storage |
| `KV` | KV Namespace | `otya-store-kv` | Version info cache (5 min TTL) |
| `DB` | D1 Database | `otya-store-db` | Download analytics & version history |
| `RATE_LIMITER` | Rate Limit | — | 60 req/min per IP on downloads |
| `EMAIL` | Send Email | petersmartlink@gmail.com | Error alerts |

## R2 Bucket Structure

Bucket: `otya-player-releases`

```
version.json          ← { tag, version, versionCode, date, changelog, arm64, arm32 }
releases/
  v1.0.0/
    otya-player-v1.0.0-arm64.apk
    otya-player-v1.0.0-arm32.apk
```

## Deployment

Push to `main` → GitHub Actions auto-deploys via Wrangler.

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare Account ID |
| `CLOUDFLARE_GLOBAL_API_KEY` | Cloudflare Global API Key |

### Adding Wrangler Secrets (run once)

```bash
npx wrangler secret put NOTIFY_EMAIL_TO
npx wrangler secret put ADMIN_TOKEN
```

### Manual Deploy

```bash
npm install
npm run deploy
```

## D1 Schema

Tables are auto-created on first request:

```sql
-- Download tracking
CREATE TABLE downloads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  abi TEXT NOT NULL,
  version TEXT,
  ip TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Version release history
CREATE TABLE version_history (
  tag TEXT PRIMARY KEY,
  version TEXT,
  released_at TEXT DEFAULT (datetime('now'))
);
```
