# OTYA Command Center security boundary

The browser never receives Resend, Cloudflare or internal service secrets.

The browser uses the normal Otya account session plus the server-issued elevated Admin session. Admin eligibility and MFA are verified server-side. Privileged routes fail closed when the required authorization is missing or expired.

Server-to-server calls may use private service credentials internally, but those credentials must never be rendered into the Command Center UI, browser storage, public documentation, ordinary logs or Next conversations.

Legacy bearer-token compatibility, where it still exists internally, is not the user-facing Admin sign-in model and must not be documented as a credential for administrators to paste into the browser.
