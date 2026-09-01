const OTYA_BRAND_HINT = /\b(otya|next)\b/i
const OTYA_NAMED_FEATURE_HINT = /\b(transfer|private|vault)\b/i
const ACCOUNT_FLOW_HINT = /(?:\b(reset|forgot|change|verify|verification|otp|sign[ -]?in|login)\b[\s\S]{0,40}\b(password|account|email|phone)\b)|(?:\b(password|account|email|phone)\b[\s\S]{0,40}\b(reset|forgot|change|verify|verification|otp|sign[ -]?in|login)\b)/i
const LOCAL_MEDIA_HINT = /(?:\b(my|local|device|library|playlist|history)\b[\s\S]{0,40}\b(music|video|media|files?|songs?|tracks?|playlist|library|history|playback)\b)|(?:\b(music|video|media|files?|songs?|tracks?|playlist|library|history|playback)\b[\s\S]{0,40}\b(my|local|device|library|playlist|history)\b)/i
const APP_TASK_HINT = /\b(app|player|screen|settings?|permissions?|notifications?|update|download|backup|storage)\b/i
const APP_SUBJECT_HINT = /\b(playback|library|playlist|media|files?|account|sign[ -]?in|login|password|theme|appearance|storage|permission|notification|update|download|backup)\b/i

const clean = (value, max = 7000) => String(value ?? '')
  .replace(/[\u0000-\u001f]/g, ' ')
  .trim()
  .slice(0, max)

export function shouldRetrieveOtyaKnowledge(message) {
  const text = String(message ?? '').trim()
  if (!text) return false
  if (OTYA_BRAND_HINT.test(text) || OTYA_NAMED_FEATURE_HINT.test(text)) return true
  if (ACCOUNT_FLOW_HINT.test(text) || LOCAL_MEDIA_HINT.test(text)) return true
  return APP_TASK_HINT.test(text) && APP_SUBJECT_HINT.test(text)
}

export async function retrieveOtyaKnowledge(env, message) {
  const query = clean(message, 1200)
  if (!query || !shouldRetrieveOtyaKnowledge(query) || !env.AI_SEARCH?.search) {
    return { used: false, context: '', chunks: 0 }
  }

  try {
    const result = await env.AI_SEARCH.search({
      messages: [{ role: 'user', content: query }],
      ai_search_options: {
        retrieval: {
          retrieval_type: 'hybrid',
          match_threshold: 0.45,
          max_num_results: 4,
          return_on_failure: true,
        },
        query_rewrite: { enabled: false },
        reranking: { enabled: false },
      },
    })

    const chunks = Array.isArray(result?.chunks) ? result.chunks : []
    const texts = chunks
      .map((chunk) => clean(chunk?.text, 2200))
      .filter(Boolean)
      .slice(0, 4)

    if (!texts.length) return { used: true, context: '', chunks: 0 }

    return {
      used: true,
      chunks: texts.length,
      context: clean(texts.map((text, index) => `[Otya knowledge ${index + 1}] ${text}`).join('\n\n'), 7000),
    }
  } catch (error) {
    console.warn('[next-knowledge]', error?.message)
    return { used: false, context: '', chunks: 0, degraded: true }
  }
}
