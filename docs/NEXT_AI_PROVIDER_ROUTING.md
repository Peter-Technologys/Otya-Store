# Next AI provider routing

Next is a product identity, not a model name. The backend may route requests to different approved inference providers without changing the user-facing assistant identity.

## Current state

The existing Otya AI Worker already supports several Cloudflare Workers AI models and has fallback selection. Cloudflare remains the beta default because it is already integrated and provides a Free-plan allowance.

The repository also contains an NVIDIA model through Cloudflare Workers AI. That is different from calling NVIDIA's hosted NIM API directly.

## Direct NVIDIA NIM adapter

`src/providers/nvidia-nim.mjs` adds a prototype-only server-side adapter for the OpenAI-compatible NVIDIA NIM endpoint.

It is dormant unless all of the following are true:

- `NVIDIA_NIM_ENABLED=true`
- `NVIDIA_API_KEY` is present as a Worker secret
- `NVIDIA_NIM_USAGE` is one of `prototype`, `development`, `testing`, or `evaluation`
- the requested model is in the configured allow-list

The adapter deliberately refuses `production` usage. NVIDIA Developer Program hosted endpoints are evaluation/prototyping services, so production routing must be a separate reviewed decision using appropriate production terms/endpoints.

## Suggested secrets/configuration for a later beta experiment

Do not commit values.

- Worker secret: `NVIDIA_API_KEY`
- variable: `NVIDIA_NIM_ENABLED=true`
- variable: `NVIDIA_NIM_USAGE=testing`
- optional variable: `NVIDIA_NIM_MODELS=<comma-separated allow-list>`
- optional variable: `NVIDIA_NIM_TIMEOUT_MS=25000`

Never send the NVIDIA key to the Flutter client.

## Routing stages

### Stage 1 — current

Cloudflare only. Direct NIM adapter is present but unused.

### Stage 2 — controlled beta benchmark

Use an internal-only or owner/tester route to compare:

- time to first token;
- end-to-end response time;
- answer quality;
- multilingual quality;
- tool/agent behavior;
- quota/rate-limit failure behavior;
- request size and cost.

No normal-user traffic should be silently routed to a trial endpoint.

### Stage 3 — production decision

Choose one or more production-capable providers based on measured quality, reliability, privacy terms, support and cost. Keep a fallback route.

## Model policy

Model identifiers are operational configuration. Do not expose a model picker with dozens of provider names to normal Otya users during v1 beta. User-facing choices should be capability-oriented only if a real need appears later (for example Fast vs Deep), while the backend owns the actual provider/model mapping.

## Knowledge and tools

Do not use expensive models as a substitute for product architecture.

- Product facts should come from verified Otya Help/Trust/release sources.
- User-specific facts should come from authenticated Otya tools/data with permission.
- Current external facts require an approved live-information tool.
- Device actions should be executed through explicit Otya client tools rather than hallucinated by the model.

## Failure rule

If all online AI providers are unavailable, Next must fail quickly and clearly. Local playback, Library, Private, Transfer, Settings and other non-AI Otya features must remain usable.
