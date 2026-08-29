# OTYA Developer Platform

## Purpose

OTYA may serve third-party developers without exposing OTYA's private infrastructure. External developers integrate through published, versioned interfaces. They never receive Cloudflare account credentials, Worker secrets, D1/KV/R2 direct access, Firebase Admin credentials, Resend credentials, signing keys, administrator sessions, or `INTERNAL_SECRET`.

## Product surfaces

1. **OTYA API** — versioned HTTPS endpoints for approved public, user-authorized, and server-to-server capabilities.
2. **OTYA SDKs** — first-party Dart/Flutter and TypeScript clients generated or maintained against the public API contract. Python may follow later.
3. **Developer Apps** — registered third-party applications with an App ID, environment, redirect URIs, scopes, rate limits, credentials and audit history.
4. **OAuth** — user-authorized access. Third-party apps never receive OTYA user passwords.
5. **Webhooks** — signed outbound events delivered to developer servers with replay protection and retry policy.
6. **OTYA MCP** — optional AI/agent interface exposing only explicitly published tools and scopes. It is separate from private Admin AI tools.
7. **OTYA Media SDK** — a future, separately versioned product that may expose selected OTYA media-engine capabilities. It is not required for the cloud developer platform.

## Trust boundaries

### Public

No user identity is required. Only intentionally public information may be returned.

### User-authorized

OAuth access tokens represent a user grant and contain only approved scopes. Tokens must be revocable, time-bounded and audience-bound.

### Server-to-server

A developer backend authenticates as its registered application. Credentials are never embedded in public mobile/web clients unless they are explicitly public identifiers.

### OTYA Admin

Private administrator capabilities are never part of the developer API. Infrastructure mutation, release control, user administration, private support access and privileged connected services remain behind OTYA Admin authorization and approval controls.

## Initial scope model

Candidate v1 developer scopes are intentionally small:

- `profile:read`
- `profile:write`
- `notifications:send`
- `media:metadata:read`
- `ai:chat`
- `webhooks:manage`

A scope must not exist until its server-side authorization, audit logging, rate limit and privacy behavior are implemented and tested.

## Developer App lifecycle

1. Developer signs in to the Developer Portal.
2. Developer creates an app.
3. OTYA issues a non-secret App ID.
4. Developer configures Development settings first.
5. Developer selects requested scopes and redirect/webhook origins.
6. OTYA validates the configuration.
7. Production access is enabled only after required review and verification.
8. Credentials can be rotated/revoked without deleting the developer account.
9. Users can revoke individual app grants.

## Environments

Every Developer App must distinguish at least:

- **Development** — safe testing, low quotas, non-production credentials.
- **Production** — reviewed redirect URIs, production credentials and stricter monitoring.

Development credentials must not gain production user access merely by changing a URL.

## API gateway requirements

All third-party traffic passes through an OTYA-controlled gateway that performs:

- authentication and token validation
- audience/issuer/expiry validation where applicable
- scope enforcement
- app/environment validation
- rate limiting and abuse controls
- request-size limits and schema validation
- audit logging without secret/token leakage
- version routing
- consistent error responses
- security headers and HTTPS-only public transport

The gateway may call internal Workers/services, but internal bindings and credentials are never forwarded to third parties.

## OAuth requirements

Use Authorization Code with PKCE for public/mobile clients. Redirect URIs are exact-match registered values. Access tokens are short-lived. Refresh tokens are revocable and stored only where appropriate. Consent screens clearly name the requesting app and requested scopes.

Never accept a third-party app's client-supplied user ID as authorization proof.

## Webhooks

Every webhook delivery must include:

- event ID
- event type
- timestamp
- signature covering the raw payload
- delivery/retry identity

Developer endpoints must be HTTPS in production. OTYA must document signature verification and replay-window handling. Failed events use bounded retries and must not block foreground OTYA requests.

## SDK requirements

The SDKs are convenience layers, not security boundaries. Server authorization is always authoritative.

SDKs should provide:

- typed API models
- auth/token helpers
- API version headers
- pagination helpers
- retry/backoff only for safe/retryable requests
- structured errors
- request IDs for support
- webhook verification helpers where relevant

Never ship OTYA administrator secrets or server-to-server credentials inside an SDK.

## MCP boundary

The public OTYA MCP surface is a separately authorized facade over published developer capabilities. It must not expose the private Admin AI tool registry.

Each MCP tool requires the same app/user authorization and audit policy as the equivalent API capability. Tool descriptions must not reveal secrets, internal binding names or private infrastructure topology beyond what developers need to integrate.

## Media SDK boundary

A future OTYA Media SDK may expose a stable `OtyaMediaEngine` API while keeping the underlying backend replaceable. Initial implementations may be powered by MediaKit/libmpv. External apps integrate against OTYA's stable interface rather than depending on OTYA Player internals.

The Media SDK must have its own licensing, codec/patent review, versioning, compatibility matrix and performance tests before public release.

## Developer Portal information architecture

- Overview
- My Apps
- Credentials
- OAuth
- Webhooks
- API Explorer
- Usage
- Logs
- SDKs
- MCP
- Documentation

The portal must never show secret values after their one-time creation flow unless the underlying credential system explicitly supports safe retrieval. Prefer rotate/reissue over repeated secret display.

## Rollout order

1. Freeze and document the public API contract.
2. Implement app registration data model and Development environment.
3. Implement OAuth/scopes and audit logs.
4. Publish OpenAPI documentation and API explorer.
5. Add signed webhooks.
6. Publish Dart/Flutter SDK.
7. Publish TypeScript SDK.
8. Add MCP facade.
9. Add production app review/quotas.
10. Consider OTYA Media SDK.
11. Consider a plugin/extension marketplace only after code-execution and permission isolation are designed and independently reviewed.

## Explicit non-goals for OTYA 1.0 launch

The OTYA Player 1.0 release does not depend on third-party developer APIs, SDKs, MCP or a plugin marketplace. Developer-platform work must not delay or destabilize local playback, Transfer, Private, account, support, updates, or offline startup.
