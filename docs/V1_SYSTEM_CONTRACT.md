# OTYA v1 Server Contract

OTYA v1 is one product. The website, API, auth, Ask OTYA and Admin must share clear boundaries instead of acting like separate products.

## Single owners

- Public product/backend API: one OTYA API contract.
- Identity/security: OTYA Auth only.
- Product-help AI: Ask OTYA only.
- Human support: one ticket/email handoff path.
- Admin operations: one private OTYA Admin surface.
- Email: Resend.
- Push business logic: OTYA backend; Android transport stays behind a transport adapter.
- Remote config/releases/NEW feature metadata: one config/release contract.
- Storage: D1 for relational records, KV for cache/config where appropriate, R2 for objects/releases, Queues for async work where justified.

## Public product rules

The public website presents one product: OTYA. Ask OTYA is embedded into Support, Contact, FAQ and Docs. Account is a supporting security/recovery surface, not a separate product. Admin AI is private and never exposed through public Ask OTYA permissions.

## AI rules

Ask OTYA answers OTYA product/help questions. It has no artificial daily user credit counter. Keep abuse/rate protection and Cloudflare quota awareness. Out-of-scope or human-required requests can create a support handoff. Never expose secrets, OTPs, refresh tokens or admin data to Ask OTYA.

## Offline boundary

Backend/auth/AI outages must not stop Android startup, local scanning, playback, local transfer or local tools.

## No placeholders

Do not publish Coming Soon, dead links, fake product cards or nonfunctional admin controls. A visible action must have a working endpoint and handled error state.

## Free-first rule

Prefer free-tier-capable infrastructure while it remains technically reliable: Cloudflare Workers/D1/KV/R2/Queues/AI within current free allocations, Resend free allowance, and free push transport. Do not silently introduce a paid dependency.

## Release gate

Validate website build, auth, AI, support email, admin authorization, config/release endpoints, device/push registration, security checks, Cloudflare deployment validation and mobile/desktop website behavior before merging v1 into main.