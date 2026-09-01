# OTYA v1 Public Surface Architecture

Status: canonical public-information map

The public OTYA ecosystem must feel like one product, not a collection of internal services.

## 1. Main site — petersmartlink.com

Purpose: company + OTYA product discovery.

Primary navigation:
- OTYA
- Features
- Next
- Download
- Support

Secondary/footer links:
- Docs
- Status
- Privacy
- Terms
- Security
- Changelog
- Contact

The homepage must quickly explain:
1. What OTYA is.
2. The main user benefit.
3. Current supported platform(s).
4. Trust/privacy basics.
5. A clear download/use action.

Do not expose internal infrastructure or unfinished product claims.

## 2. Docs — docs.petersmartlink.com

Purpose: user help and feature documentation.

Recommended structure:

- Getting started
  - Install OTYA
  - First launch
  - Media permissions
  - Find local media
- Video
  - Playback controls
  - Gestures
  - Subtitles/audio tracks
  - Speed
  - Picture-in-picture
  - Continue watching
- Music
  - Songs/albums/artists
  - Playlists
  - Queue
  - Search
  - Background playback
- Transfer
  - Nearby devices
  - Send
  - Receive
  - Security/privacy
  - Troubleshooting
- Private
  - Protect media
  - Import/export/restore
  - Uninstall/data implications
- Media Tools
  - Convert
  - Trim
  - Supported formats
  - Output location
- Next
  - What Next can do
  - Live/current information
  - OTYA knowledge
  - Limitations
  - Privacy
- Account & Space
  - Create/sign in
  - Google sign-in
  - Recovery
  - Delete account
  - Backups/sync only when live
- Troubleshooting
- Contact support

Forbidden in public Docs:
- Cloudflare Worker names/topology
- D1/KV/R2 IDs
- queue IDs/topology
- secret names/values unless a public integration explicitly requires a documented environment variable
- internal admin rules
- raw logs
- private API routes
- internal model-routing policy
- release-control internals
- incident playbooks

## 3. Status — status.petersmartlink.com

Purpose: safe operational transparency.

Public components:
- OTYA Accounts
- Next
- OTYA Web
- Downloads & Updates
- OTYA Space (only when released)

States:
- Operational
- Degraded performance
- Partial outage
- Major outage
- Maintenance

Incident stages:
- Investigating
- Identified
- Monitoring
- Resolved

Never expose stack traces, internal service names, database details or security-sensitive diagnostics.

## 4. Space — space.petersmartlink.com

Purpose: user-owned account/cloud surface.

Signed out:
- Sign in
- Create OTYA Account
- Google sign-in where available
- Recover account
- Concise explanation of Space

Signed in:
- account summary
- user-owned synced/backed-up data that is genuinely implemented
- connected services/devices when implemented
- privacy/data controls
- sign out

Do not show Admin, infrastructure, deployment, logs or owner tools.

If Space does not yet have enough real user functionality, keep the surface minimal/private rather than filling it with placeholder cards.

## 5. Support

User-facing support categories:
- Help Center / Docs
- Report a problem
- Account help
- Privacy request
- Security report
- General contact

Categories may initially share backend/mail infrastructure, but the user-facing intake should remain organized.

## 6. Privacy / Terms / Security

Privacy must reflect actual OTYA behavior, including:
- local vs server-processed data
- OTYA Account data
- Next prompts/conversations and retrieval
- Transfer behavior
- Private media behavior
- analytics/crash reporting
- retention/deletion
- user rights/request path

Security page should provide safe security commitments and a responsible reporting path without publishing exploitable architecture.

Terms should describe actual supported services and responsibilities, not speculative features.

## 7. Changelog

Use user-language grouped as New / Improved / Fixed.

Do not mix current incidents into the changelog. Do not publish internal deployment notes as customer-facing release notes.

## 8. SEO / crawler policy

- Normal public search indexing: allowed.
- `/api/`: disallowed from search crawling.
- AI training: disallowed (`ai-train=no`).
- Do not enable broad AI crawlers merely to fix AI Search ingestion.
- AI Search crawler exceptions must be deliberate and narrow enough to preserve the public content policy.

## 9. Canonical public/private boundary

Public users interact with `otya-core` only. `otya-auth` and `otya-next` are private service bindings and must not become public endpoints simply for convenience.

Canonical Worker topology:
- `otya-core` — only public Worker / website / API gateway / release control plane
- `otya-auth` — private identity service
- `otya-next` — private Next service

Physical compatibility identifiers such as `otya-store-db` and `com.otyaplayer.app` remain unchanged during the v1 cutover unless an explicit migration is separately approved and tested.
