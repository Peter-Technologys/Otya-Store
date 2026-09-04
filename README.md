# OTYA Backend

The private production backend for **OTYA** by **PeterSmart Link**.

**PeterSmart Link:** https://petersmartlink.com  
**OTYA product:** https://petersmartlink.com/otya-player

This repository contains production infrastructure for the shared OTYA account, Otya Player APIs, Next, secure recovery, release delivery, notifications, support and future PeterSmart Link / OTYA product capabilities.

## Production principles

- One shared OTYA identity across supported products and sign-in methods
- Admin is a server-authorized role inside the same OTYA identity, not a separate account
- Product-specific data remains separately scoped
- Real server-side authentication and session management
- Server-side Google identity verification
- Optional verified phone and linked identity support
- Explicit opt-in recovery backup support
- Transactional email through Resend
- Signed application release delivery
- Cloudflare Workers-based production infrastructure
- Security scanning and dependency review through GitHub Actions
- Secrets stored in protected platform/GitHub secret stores, never in client code
- Next remains optional for Otya Player and cannot block local playback

## Public product information

PeterSmart Link is the developer/publisher. OTYA is a product family. Public information is separated by purpose instead of exposing internal infrastructure as product documentation.

- PeterSmart Link: https://petersmartlink.com
- Products: https://petersmartlink.com/apps
- Otya Player: https://petersmartlink.com/otya-player
- Otya Player download: https://petersmartlink.com/download/otya-player
- Documentation: https://docs.petersmartlink.com
- OTYA Space: https://space.petersmartlink.com
- Next: https://space.petersmartlink.com/ask
- Service status: https://status.petersmartlink.com

## Public GitHub

Production infrastructure details remain private even when this repository is accessible to an authorized maintainer. Public repositories should contain only material deliberately approved for public release: product documentation links, release/checksum information, issue templates, security-reporting guidance, examples and SDKs intended for developers.

Starter public-repository files are maintained under `public-github-template/` until or unless a dedicated public developer repository replaces them.

## Security

Do not report vulnerabilities in public issues. Follow [SECURITY.md](SECURITY.md) for the private reporting process.

## Source and licensing

The OTYA backend is proprietary software and production infrastructure. Source code, deployment configuration, schemas, internal routes, operational documentation and platform integration logic may not be copied, redistributed, modified or commercially reused without prior written permission from PeterSmart Link, except for third-party components governed by their own licenses.

See [LICENSE](LICENSE).

---

**OTYA · PeterSmart Link**
