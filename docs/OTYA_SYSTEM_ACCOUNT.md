# OTYA System Account

OTYA Auth is the shared identity service for the entire OTYA ecosystem. It is not owned by OTYA Player.

## Core rule

One person has one OTYA System account and one stable `user_id`. The same credentials and identity may be used by OTYA Player and future OTYA products.

## What OTYA Auth owns

- email/password and Google identity
- email verification and password recovery
- access/refresh sessions
- account profile (name/avatar)
- legal and marketing consent
- account security and lifecycle
- product membership/last-seen metadata

## What products own

Each product stores its own domain data in its own service/database, keyed by the shared OTYA `user_id`.

Examples:

- OTYA Player: playlists, playback history, devices, player preferences, sync metadata
- Future OTYA app: its own app-specific records, also keyed by the same `user_id`

Product data must not be copied into the auth database merely to make single sign-on work.

## Product IDs

Use stable lowercase identifiers such as:

- `otya-player`
- `otya-ai`
- future products: assign one permanent product ID before production

The `user_products` table records which shared account has used which product. It is not an entitlement or billing table by itself.

## Authentication contract

All OTYA products authenticate against the same OTYA Auth service and receive the same stable subject (`sub` / user ID). A product then uses that user ID to load only the data it owns and is authorized to access.

Never let one product query another product's private data merely because both share an account. Cross-product access requires an explicit server-side permission/tool contract.

## User experience

Authentication copy should say **OTYA System account**, for example:

- Sign in to your OTYA System account
- Create an OTYA System account
- One account for OTYA products

Product pages may explain the benefit in context, e.g. “Use your OTYA System account to sync OTYA Player.”

## Future platform capabilities

This design supports adding, without replacing user accounts:

- central account/security page
- active devices and session management
- product membership list
- cross-product profile/preferences
- consent and privacy controls
- data export/deletion orchestration
- per-product entitlements/subscriptions
- admin roles and organization accounts
- passkeys/2FA

## Security boundary

A shared account is not a shared database permission. Customer tokens must remain least-privilege. Admin/AI connectors require separate authorization and cannot be inherited by normal customer sessions.
