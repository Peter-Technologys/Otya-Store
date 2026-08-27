# OTYA System Asset Kit

This document is the single source of truth for OTYA website, app-store, social, APK-release and future marketing assets.

## Already wired assets

- `public/otya-icon.svg` — canonical OTYA symbol.
- `public/android-chrome-192x192.png` — PWA icon.
- `public/android-chrome-512x512.png` — PWA/app icon.
- `public/apple-touch-icon.png` — Apple/iOS browser icon.
- `public/favicon.ico`, `public/favicon-16x16.png`, `public/favicon-32x32.png` — browser tab icons.
- `public/og-image.jpg` and `public/og-image.svg` — social preview.
- `public/future-graphic.png` — existing future/hero graphic.
- `public/manifest.json` and `public/site.webmanifest` — PWA manifest files.

## New reusable brand assets

- `public/brand/otya-feature-graphic.svg` — Google Play / website feature banner template.
- `public/brand/otya-social-card.svg` — social sharing / announcement card template.
- `public/brand/otya-release-poster.svg` — release/update poster template.
- `public/brand/otya-screenshot-frame.svg` — screenshot frame for website and store listings.
- `public/brand/README.md` — usage notes.

## Asset groups the system should maintain

### Website

- Favicon set.
- PWA manifest icons.
- OpenGraph image.
- Twitter/social card image.
- Hero/future graphic.
- App download badges.
- Release update poster.

### OTYA Player app store

- App icon 512x512.
- Feature graphic 1024x500.
- Phone screenshots.
- Tablet screenshots if supported.
- Short description.
- Long description.
- Privacy policy page.
- Support page.
- Changelog page.

### APK/self-update system

- APK artifact names.
- Version JSON.
- Release notes.
- SHA-256 checksum text.
- Update dialog image/banner.
- Download page hero graphic.

### Auth/email system

- Welcome email header image.
- OTP/security email header image.
- Password reset email header image.
- Transactional email footer brand line.
- Verified Resend sender domain: `petersmartlink.com`.

### Future graphics

- Major release poster.
- New feature poster.
- Security/privacy poster.
- Update available poster.
- Store banner.
- Social launch card.

## Real screenshots policy

Do not fake final app screenshots. Use `public/brand/otya-screenshot-frame.svg` as a template only. Final screenshots should be captured from the real APK after the Debug APK workflow produces a working artifact.

## Recommended missing tool integrations

- Direct Cloudflare account tool/MCP for Workers, DNS, D1, KV, R2, routes and logs.
- Google Play Console access for app listing, APK/AAB tracks, screenshots and policy checks.
- Firebase or Google Cloud access if FCM/push notifications are used.
- Sentry or another crash-reporting dashboard if production error reports need inspection.
- Browser/device testing service for real screenshots across screen sizes.
- Design/image generation workflow for high-polish marketing art.

## Production verification checklist

- GitHub `main` is green.
- Cloudflare Worker deploy is green.
- Auth Worker deploy is green.
- D1/KV bindings are connected.
- Resend domain is verified.
- Website pages load.
- API endpoints respond.
- OTP/register/login/reset flows work.
- APK artifact downloads.
- App screenshots are captured from a real build.
