# OTYA Web Music Fix — 2026-08-30

This change fixes the current production website music experience without changing OTYA's offline-first product identity.

- Website navigation now uses the canonical OTYA SVG mark.
- `/music` uses a persistent browser audio element so play actions remain inside the user's click gesture on mobile browsers.
- Online music is presented as a responsive artwork-first discovery grid with clear Play and Download states.
- A sticky Now Playing bar remains accessible while scrolling.
- Provider-authorized Jamendo downloads go through `/api/music/jamendo/download/[id]` and are returned as `audio/mpeg` with a real `.mp3` attachment filename.
- Downloads remain disabled when Jamendo reports `audiodownload_allowed !== true`.
- The server still uses Jamendo's server-side client ID and does not expose the client secret.
