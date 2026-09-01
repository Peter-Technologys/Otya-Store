# OTYA v1 Product Governance

Status: canonical v1 product rulebook

This document prevents OTYA from growing as disconnected features. Product, web, Android, Next, support, documentation and infrastructure must follow the same information architecture and naming rules.

## Canonical product names

- Company: **PeterSmart Link**
- Product: **OTYA**
- AI assistant: **Next** / **Next by OTYA** where a fuller label is useful
- User identity: **OTYA Account**
- User cloud/personal space: **OTYA Space**
- Android navigation: **Video / Music / Me**

Legacy names such as OtyaPlayer, Played, WOP, Ask OTYA, Message Otya, OTYA AI, otya-store and otya-ai must not appear in new customer-facing copy. Internal legacy identifiers may remain only where removal would break compatibility and must have an explicit migration path.

## Product-quality acceptance levels

A feature is not "done" because code exists.

1. **Implemented** — source exists.
2. **Functionally verified** — the real action succeeds.
3. **Product-quality verified** — fast, understandable, accessible, responsive, polished, with loading/empty/error/recovery states.
4. **Release verified** — production backend + physical Android device + security/configuration + end-to-end flow pass.

Only level 4 counts toward OTYA 1.0 release readiness.

## Information classification

Every new data field, page, API and integration must be classified before release.

### Public

Safe for everyone: product features, download information, public help, public Docs, status, privacy, terms, security contact, changelog and intentionally public catalog content.

### User-private

Visible only to the authenticated user: account data, private media metadata, personal playlists/history where synced, Next conversations where stored, backups and Space content.

### Staff

Support/operations information required for authorized work. Never expose through public pages.

### Admin

Release approval, user/account administration, incident controls, operational metrics and owner tools. Server-enforced authorization is mandatory.

### Engineering-private

Worker topology, database schema, queue topology, deployment/rollback, internal APIs, incident playbooks and architecture details.

### Secret

API keys, tokens, JWT secrets, private keys, service-account credentials and encryption keys. Secret-store only; never documentation or client code.

## Public surface rules

The public product must stay simpler than the internal system.

### petersmartlink.com

Primary company/product surface. It must answer: what OTYA is, why it is useful, supported platforms, privacy/trust basics, and how to download/use it.

### docs.petersmartlink.com

Public user documentation only. Do not expose Worker names, database IDs, queue names, secrets, internal monitoring thresholds, release internals, raw logs or private architecture.

### status.petersmartlink.com

Operational truth only: service state, incidents and incident history. No marketing copy and no stack traces.

### space.petersmartlink.com

OTYA Account/Space entry point. Signed-out users get login/signup. Signed-in users get their own user home. Do not expose Admin or engineering controls.

## Public documentation scope

Public Docs may cover:

- Getting started and installation
- Video playback and controls
- Music library, queue and playlists
- Transfer send/receive and troubleshooting
- Private media behavior
- Media Tools and supported formats
- Next capabilities, live-search behavior, limitations and privacy
- Account, Google sign-in, recovery and deletion
- Space/backups only when actually available
- Troubleshooting and support

Private engineering documentation belongs in the repository or authenticated internal tools, not on the public Docs hostname.

## Status model

Public components should use user-language, for example:

- OTYA Accounts
- Next
- OTYA Web
- Downloads & Updates
- OTYA Space

Incident lifecycle: Investigating -> Identified -> Monitoring -> Resolved.

Never expose internal service bindings or stack traces.

## Changelog model

Status answers "is it working?". Changelog answers "what changed?".

Release notes should use user outcomes under New / Improved / Fixed. Avoid internal implementation detail unless it materially helps developers or security reviewers.

## Product communication rules

- No fake metrics or unsupported superiority claims.
- No copied competitor wording, layouts or screenshots.
- Research competitors for patterns and user expectations, then design an OTYA-specific solution.
- Public posts describe user outcomes, not Worker/D1/queue maintenance.
- Do not publish empty News/Careers/Developer sections just to look large.
- Do not advertise platforms or capabilities that are not production-ready.

## Design and performance rules

Modernization means hierarchy, motion, responsiveness and consistency, not simply gradients or rounded rectangles.

Every user-facing workflow needs:

- immediate interaction feedback
- meaningful loading/progress state
- useful empty state
- specific error message
- recovery/retry action when possible
- accessibility semantics
- responsive layout
- light/dark compatibility
- consistent OTYA typography, spacing, shapes and iconography

For Next specifically, sending a prompt must never create a long blank wait. Show immediate thinking/tool state, stream output as soon as possible, expose Stop/Retry, and route simple questions directly instead of invoking expensive retrieval unnecessarily.

## v1 release discipline

No new feature expansion until the v1 blockers pass. Priority is stabilization, modernization and system coherence.

A release remains blocked by any P0 failure in account creation/sign-in, Next response path, update/download path, core media playback, physical Android media-session acceptance, or required production infrastructure.
