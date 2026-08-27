# OTYA Platform Backend

The private production backend for the OTYA System by PeterSmartLink.

**Official service:** https://petersmartlink.com

This repository contains production infrastructure for OTYA account services, application APIs, secure recovery, release delivery, notifications and supporting platform services.

## Production principles

- Real server-side authentication and session management
- Server-side Google identity verification
- Explicit opt-in recovery backup support
- Transactional email through server-side providers
- Signed application release delivery
- Cloudflare Workers-based production infrastructure
- Security scanning and dependency review through GitHub Actions
- Secrets stored in protected platform/GitHub secret stores, never in client code

## Public product information

Customer-facing product information, downloads, support and release notices are published through the official OTYA/PeterSmartLink channels rather than this source repository.

- Website: https://petersmartlink.com
- OTYA Player: https://petersmartlink.com/download/otya-player

## Security

Do not report vulnerabilities in public issues. Follow [SECURITY.md](SECURITY.md) for the private reporting process.

## Source and licensing

The OTYA backend is proprietary software and production infrastructure. Source code, deployment configuration, schemas, internal routes, operational documentation and platform integration logic may not be copied, redistributed, modified or commercially reused without prior written permission from PeterSmartLink, except for third-party components governed by their own licenses.

See [LICENSE](LICENSE).

---

**OTYA System · PeterSmartLink**
