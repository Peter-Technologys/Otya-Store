# OTYA Backend

The private production backend for **OTYA** by PeterSmart Link.

**Official service:** https://petersmartlink.com

This repository contains production infrastructure for the shared OTYA account, OTYA Player APIs, OTYA AI, secure recovery, release delivery, notifications, support and future OTYA products.

## Production principles

- One shared OTYA identity across products
- Product-specific data remains separately scoped
- Real server-side authentication and session management
- Server-side Google identity verification
- Explicit opt-in recovery backup support
- Transactional email through Resend
- Signed application release delivery
- Cloudflare Workers-based production infrastructure
- Security scanning and dependency review through GitHub Actions
- Secrets stored in protected platform/GitHub secret stores, never in client code
- AI remains optional for OTYA Player and cannot block local playback

## Public product information

Customer-facing product information, documents, downloads, support and release notices are published through the official OTYA website rather than this private source repository.

- OTYA: https://petersmartlink.com
- Documents: https://petersmartlink.com/documents
- OTYA AI: https://petersmartlink.com/ai
- OTYA Player: https://petersmartlink.com/otya-player
- OTYA Player download: https://petersmartlink.com/download/otya-player

## Security

Do not report vulnerabilities in public issues. Follow [SECURITY.md](SECURITY.md) for the private reporting process.

## Source and licensing

The OTYA backend is proprietary software and production infrastructure. Source code, deployment configuration, schemas, internal routes, operational documentation and platform integration logic may not be copied, redistributed, modified or commercially reused without prior written permission from PeterSmart Link, except for third-party components governed by their own licenses.

See [LICENSE](LICENSE).

---

**OTYA · PeterSmart Link**
