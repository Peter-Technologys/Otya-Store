# Historical Web Music Fix — 2026-08-30

> **Superseded on 2026-09-02.** This file is retained only as project history. It is not a current Otya product or security contract. The Online Music/Jamendo catalog, OAuth, status and download-proxy routes were subsequently retired. Current Music behavior is local-first; see `docs/V1_SYSTEM_CONTRACT.md`.

At the time of this historical change, the website music experiment used a browser audio element, an artwork-first online discovery grid, a Now Playing bar and provider-authorized Jamendo downloads through `/api/music/jamendo/download/[id]`.

Those implementation details must not be treated as active requirements and must not be restored merely to satisfy old documentation or tests.
