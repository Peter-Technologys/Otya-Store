# OTYA AI Support Console

Private admin interface: `/admin/ai`

## What it does

- Lists recent inbound emails visible to Resend Receiving.
- Reads an individual support message.
- Produces an AI draft with category and risk level.
- Requires explicit admin approval before sending.
- Sends replies as `OTYA Support <support@petersmartlink.com>` through Resend.
- Uses `In-Reply-To`/`References` for normal email threading.
- Records draft/send audit metadata in D1.

## Security boundary

The browser never receives `RESEND_API_KEY` or `INTERNAL_SECRET`.

1. The admin browser calls `/api/admin/ai/support/*` on `otya-store` with the existing admin bearer token.
2. `otya-store` verifies `ADMIN_TOKEN`.
3. `otya-store` forwards the request to the `AI_SUPPORT` service binding and injects `INTERNAL_SECRET` server-side.
4. `otya-ai` verifies `INTERNAL_SECRET` before any inbox/read/draft/send operation.
5. `otya-ai` calls Resend using `RESEND_API_KEY`.

If `INTERNAL_SECRET` is missing on either side, the console fails closed.

## Production prerequisites

- `RESEND_API_KEY` on `otya-ai`.
- The same `INTERNAL_SECRET` on `otya-store` and `otya-ai`.
- Resend Receiving enabled for an address/domain that receives support mail.
- Do not replace existing root-domain MX records without checking the current mailbox provider. Forwarding the existing `support@petersmartlink.com` mailbox into a Resend receiving address is a safe option when the root domain already has mail hosting.

## Default sending policy

Auto-send is intentionally disabled. The first production version is `draft -> review/edit -> approve & send`.

High-risk subjects (security, billing disputes, account deletion, data export, legal issues, suspected compromise) are marked for human review by the model and must never be automatically sent without a future explicit policy change.
