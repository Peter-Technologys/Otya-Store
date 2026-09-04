# PeterSmart Link platform

This document is the canonical public-product architecture for the PeterSmart Link web ecosystem.

## Brand hierarchy

- **PeterSmart Link** is the developer, publisher and organization.
- **Otya** is a PeterSmart Link product family.
- **Otya Player** is the Android local music and video player.
- **Next** is the assistant available through Otya surfaces.
- **Space** is the signed-in environment for one Otya account.
- **Admin** is a role inside Space, not a second account or a second identity system.

Do not present `petersmartlink.com` as though PeterSmart Link and Otya Player are the same thing. The company site may feature Otya prominently, but product pages belong below the organization layer.

## Public surfaces

### petersmartlink.com

PeterSmart Link organization and product website. It should explain who builds the products, what products exist, how to get support, where documentation lives and how to reach the signed-in environment.

Primary information architecture:

- Products
- Otya
- Developers
- Company
- Support
- Sign in / Space

### space.petersmartlink.com

One signed-in environment for one Otya identity. Account, security, connected providers, devices, settings, Next, Telegram and eligible Admin controls live here.

A user does not create a separate Admin account. The authenticated Otya identity is assigned server-side roles and permissions.

### docs.petersmartlink.com

Public documentation. Documentation should be task-oriented and safe to publish. It must not expose secrets, internal service bindings, raw logs, private database identifiers, signing material, private infrastructure topology or security bypass details.

### status.petersmartlink.com

Operational status only: service state, incidents and incident history. Keep marketing and internal diagnostics out of the status surface.

## Authentication and roles

OTYA uses one account identity with multiple sign-in methods.

1. A person authenticates using email, Google or another supported provider.
2. The server resolves that provider to the same Otya account.
3. The server resolves roles for that account.
4. Normal users enter Space normally.
5. An owner/admin account may complete required owner verification during the same sign-in journey.
6. Once verified, Admin appears inside Space according to the server-authorized role.

Google sign-in is already a primary authentication method. Do not ask the user to re-enter the normal Otya password merely because Google was used. Additional verification is a security factor, not a second login identity.

## Admin security rule

Admin UI visibility never grants authority by itself. Every privileged backend action remains server-authorized.

High-impact actions may require fresh step-up verification even when the owner is already signed in. Examples include changing administrator access, destructive account/data operations, security configuration, secrets, production publishing and similarly consequential operations.

## Developer identity

Use **PeterSmart Link** as the public developer/publisher brand unless a store or legal process specifically requires the verified legal identity. Do not use Otya as the developer name because Otya is a product.

## Product-quality rule

Every public route must have a clear purpose. Do not keep placeholder routes that simply redirect unrelated sections together when a real destination is expected. Navigation, page titles, metadata, footer links, documentation and account surfaces must use the same hierarchy and terminology.
