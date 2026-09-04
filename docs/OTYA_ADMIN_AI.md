# OTYA Command Center

The OTYA Command Center is the private administrator workspace inside Otya Space. Its primary interface is conversational: an authorized owner can ask what needs attention, investigate a problem, review support, prepare a release, inspect connected systems or request a report without navigating a maze of dashboards.

**Next** is the user-facing Otya assistant. It must never receive Command Center-only context, support mail, infrastructure credentials, administrator tools or privileged audit data.

## Identity and entry model

The Command Center does not have a separate user account or a separate username/password login.

1. The person signs in with the normal Otya account using a supported method such as Google or email.
2. The server resolves the account's role.
3. If the account is eligible for owner/Admin capabilities and fresh verification is required, that verification happens in the normal Otya sign-in journey.
4. The authorized account enters the same Otya Space environment, where Admin appears according to server-authorized permissions.
5. Privileged APIs continue to verify the elevated Admin session independently of the UI.

High-impact operations may require fresh step-up verification even when the administrator is already signed in.

## Information architecture

### Chat

The default view is a full conversational workspace with:

- new conversation
- persistent conversation history where enabled
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

Settings control the power behind the conversation rather than replacing it. The settings model may include:

- AI & models
- Connections
- Permissions & approvals
- Notifications
- Security
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
- changing administrator access
- other destructive or difficult-to-reverse actions

The AI response itself is never authorization. Server-side policy remains authoritative.

## Secret handling

The Command Center must not render secret values into ordinary chat history, logs, analytics or settings pages. Prefer connection status, credential names/identifiers and last-verified timestamps over secret-value display.

No Cloudflare token, Firebase Admin private key, Resend key, signing key, OAuth client secret, internal service secret or equivalent privileged credential may be forwarded to public Next or a third-party Developer App.

## Developer Platform separation

OTYA Developer Apps, SDKs, OAuth clients, webhooks and public MCP tools are a separate trust boundary. A developer integration can access only published capabilities and granted scopes. It can never inherit Command Center permissions simply because it connects to the same Otya backend.

## Release acceptance

Before OTYA 1.0 is considered complete, the Command Center must be tested on mobile and desktop for:

- normal Otya sign-in followed by correct role resolution
- owner verification path when required
- Google sign-in without a redundant normal-password prompt
- conversation create/open/send
- session refresh/expiry
- support inbox/read/draft/send-confirmation
- connection status and connection failures
- unauthorized-account rejection
- offline/service-error states
- write approval behavior
- no privileged data leakage into public Next
