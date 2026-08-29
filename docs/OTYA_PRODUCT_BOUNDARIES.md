# OTYA product boundaries

OTYA is one Android media product.

## Public product

- OTYA Android app: Video, Music and Me.
- OTYA website: product information, download, docs, support and account.
- Ask OTYA: inline help inside support, docs and contact. It is not presented as a separate public product.

## Account

OTYA Account supports the app. It handles identity, verification, recovery, sessions, backup and connected features.

Local playback, media scanning and basic local transfer must not require an account.

## AI

There are two permission levels:

1. Ask OTYA for users: public support and help. Never receives passwords, OTPs, refresh tokens or admin data.
2. OTYA Admin Assistant: private operations tool for authorized administrators only. It can work with support, health, crashes, releases and approved connections.

The public helper and admin assistant may share AI infrastructure, but they must never share authorization or private admin context.

## Offline rule

Cloudflare, auth or AI outages must not stop local music/video playback or local library access.
