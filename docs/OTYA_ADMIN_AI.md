# OTYA Command Center

The OTYA Command Center is the private administrator workspace. Its primary interface is conversational: the administrator should be able to ask the operator what needs attention, investigate a problem, review support, prepare a release, inspect connected systems, or request a report without navigating a maze of dashboards.

Public Ask OTYA is a separate product surface and must never receive Command Center-only context, support mail, infrastructure credentials, administrator tools or privileged audit data.

## Information architecture

### Chat

The default view is a full conversational workspace with:

- New conversation
- persistent conversation history
- streaming/clear assistant responses when supported
- useful suggested prompts for an empty conversation
- visible progress for long-running checks
- structured results for health, crashes, releases, support and connected systems
- clear error/retry states

### Support

Support mail remains accessible as a dedicated operational view. Drafting may use AI; sending is an external write and keeps explicit confirmation/approval.

### Connections

Connections are private services used by the administrator/operator, such as Gmail, GitHub, Cloudflare, Firebase or Resend. They are not third-party Developer Apps and do not become public plugins.

### Settings

Settings control the power behind the conversation rather than replacing it. The settings model includes:

- AI & models
- Connections
- Permissions & approvals
- Notifications
- Security & 2FA
- Developer Platform
- Audit history
- Appearance

## Authorization model

Read-only operational checks may run automatically when the signed-in administrator is authorized for them.

Meaningful writes require an approval boundary. This includes, where applicable:

- sending external messages
- changing production configuration
- changing feature rollout state
- deploying or publishing
- deleting data/resources
- rotating/revoking credentials
- modifying user/account state
- other destructive or difficult-to-reverse actions

The AI response itself is never authorization. Server-side policy remains authoritative.

## Secret handling

The Command Center must not render secret values into ordinary chat history, logs, analytics or settings pages. Prefer connection status, credential names/identifiers and last-verified timestamps over secret-value display.

No Cloudflare token, Firebase Admin private key, Resend key, signing key, OAuth client secret, `INTERNAL_SECRET` or equivalent privileged credential may be forwarded to public Ask OTYA or a third-party Developer App.

## Developer Platform separation

OTYA Developer Apps, SDKs, OAuth clients, webhooks and public MCP tools are a separate trust boundary. A developer integration can access only published capabilities and granted scopes. It can never inherit Command Center permissions simply because it connects to the same OTYA backend.

## Release acceptance

Before OTYA 1.0 is considered complete, the Command Center must be tested on mobile and desktop for:

- administrator sign-in
- 2FA/recovery path
- conversation create/open/send
- session refresh/expiry
- support inbox/read/draft/send-confirmation
- connection status and connection failures
- unauthorized-account rejection
- offline/service-error states
- write approval behavior
- no privileged data leakage into public Ask OTYA
