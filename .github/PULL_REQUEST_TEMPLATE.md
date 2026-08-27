## Summary

Describe what changed and why.

## Area

- [ ] Website/API
- [ ] Authentication
- [ ] Email/Resend
- [ ] D1/KV/R2
- [ ] Queue/cron/workflow
- [ ] Cloudflare/Wrangler
- [ ] Release/update system
- [ ] Security

## Production safety

- [ ] No secret values are committed or logged.
- [ ] Existing D1/KV/R2 data is preserved unless deletion is explicitly intended and documented.
- [ ] Auth/session compatibility was considered.
- [ ] GitHub Actions remains the deployment source of truth.
- [ ] Cloudflare bindings/routes are not unintentionally removed.
- [ ] Resend/Google/internal credentials remain server-side.
- [ ] Rollback impact is understood.

## Validation

- [ ] Backend build passes.
- [ ] TypeScript checks pass.
- [ ] Auth-worker typecheck passes when affected.
- [ ] Security checks pass.
- [ ] Relevant production endpoint/flow was tested or a reason is documented.
