const OTYA_KNOWLEDGE_HINT = /\b(otya|next|playback|music|video|library|playlist|history|files?|transfer|private|vault|converter|equalizer|account|sign[ -]?in|login|password|verification|otp|backup|notification|update|download|permission|privacy|terms|support|help|storage|theme|appearance)\b/i

const clean = (value, max = 7000) => String(value ?? '')
  .replace(/[\u0000-\u001f]/g, ' ')
  .trim()
  .slice(0, max)

export function shouldRetrieveOtyaKnowledge(message) {
  return OTYA_KNOWLEDGE_HINT.test(String(message ?? ''))
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
