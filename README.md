# Otya Store — Cloudflare Worker

Serves OTYA Player APK downloads from Cloudflare R2.

**Live at:** https://getotya.petersmartlink.com

## Endpoints

| Route | Description |
|---|---|
| `GET /` | Redirects to download page |
| `GET /version` | Returns current version info from R2 `version.json` |
| `GET /latest` | Returns full version + download links JSON |
| `GET /download` | Auto-detects ABI and redirects to APK |
| `GET /apk/arm64` | Streams arm64 APK from R2 |
| `GET /apk/arm32` | Streams arm32 APK from R2 |

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

| Secret | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Workers:Edit permission |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare Account ID |

### Manual Deploy

```bash
npm install
npm run deploy
```
