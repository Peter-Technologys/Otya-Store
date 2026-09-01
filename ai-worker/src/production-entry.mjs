import worker from './scheduled-entry.mjs'
import { withPublicNextKnowledge } from './next-knowledge-runtime.mjs'

export default {
  ...worker,
  async fetch(request, env, ctx) {
    return worker.fetch(request, withPublicNextKnowledge(env), ctx)
  },
  async queue(batch, env, ctx) {
    return worker.queue(batch, env, ctx)
  },
  async scheduled(event, env, ctx) {
    return worker.scheduled(event, env, ctx)
  },
}
