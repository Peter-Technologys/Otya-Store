/**
 * Reusable AI helper module — wraps Workers AI models.
 * All functions handle errors gracefully and return safe fallback values.
 * Never throws — callers can always use the result directly.
 */

// ── AI binding type ───────────────────────────────────────────────────────────

export interface AiBinding {
  run(model: string, input: unknown): Promise<unknown>
}

// ── Return types ──────────────────────────────────────────────────────────────

export interface CategorizeFeedbackResult {
  category:   'bug' | 'feature_request' | 'complaint' | 'praise' | 'crash_report'
  sentiment:  'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
  confidence: number
}

export interface AnomalyResult {
  anomaly: boolean
  reason:  string
}

export interface ForceUpdateResult {
  force:  boolean
  reason: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Extract the first JSON object from a freeform LLM response string. */
function extractJson<T>(text: string): T | null {
  try {
    // Try direct parse first
    return JSON.parse(text) as T
  } catch {
    // Fall back to extracting the first {...} block
    const match = text.match(/\{[\s\S]*?\}/)
    if (match) {
      try { return JSON.parse(match[0]) as T } catch { /* ignore */ }
    }
    return null
  }
}

/** Pull the text response out of whatever shape the AI binding returns. */
function extractText(response: unknown): string {
  if (typeof response === 'string') return response
  if (response && typeof response === 'object') {
    const r = response as Record<string, unknown>
    if (typeof r.response === 'string') return r.response
    if (typeof r.generated_text === 'string') return r.generated_text
    if (Array.isArray(r.result)) {
      const first = r.result[0] as Record<string, unknown> | undefined
      if (first && typeof first.generated_text === 'string') return first.generated_text
    }
  }
  return ''
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Categorize a piece of user feedback.
 * 1. Runs DistilBERT SST-2 for sentiment.
 * 2. Runs Llama 3.1 8B to classify into one of five categories.
 * Returns a safe fallback if either model call fails.
 */
export async function categorizeFeedback(
  ai: AiBinding,
  description: string,
): Promise<CategorizeFeedbackResult> {
  const fallback: CategorizeFeedbackResult = {
    category:   'complaint',
    sentiment:  'NEUTRAL',
    confidence: 0,
  }

  // ── Step 1: sentiment via DistilBERT ─────────────────────────────────────
  let sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' = 'NEUTRAL'
  let confidence = 0
  try {
    const sentimentRes = await ai.run('@cf/huggingface/distilbert-sst-2-int8', {
      text: description.substring(0, 512),
    })
    // Response shape: [{ label: 'POSITIVE'|'NEGATIVE', score: number }]
    const results = (sentimentRes as { label: string; score: number }[] | undefined) ?? []
    const top = results.sort((a, b) => b.score - a.score)[0]
    if (top) {
      sentiment  = top.label === 'POSITIVE' ? 'POSITIVE' : 'NEGATIVE'
      confidence = Math.round(top.score * 100) / 100
    }
  } catch (e) {
    console.error('[AI] DistilBERT sentiment failed:', (e as Error)?.message)
  }

  // ── Step 2: category via Llama ────────────────────────────────────────────
  let category: CategorizeFeedbackResult['category'] = 'complaint'
  try {
    const prompt = [
      {
        role: 'system',
        content:
          'You are a feedback classifier. Classify the user feedback into exactly one of these categories: ' +
          'bug, feature_request, complaint, praise, crash_report. ' +
          'Respond with ONLY a JSON object: {"category": "<value>"}. No explanation.',
      },
      {
        role: 'user',
        content: `Feedback: "${description.substring(0, 800)}"`,
      },
    ]
    const llmRes = await ai.run('@cf/meta/llama-3.1-8b-instruct', { messages: prompt })
    const text   = extractText(llmRes)
    const parsed = extractJson<{ category: string }>(text)
    const valid  = ['bug', 'feature_request', 'complaint', 'praise', 'crash_report']
    if (parsed?.category && valid.includes(parsed.category)) {
      category = parsed.category as CategorizeFeedbackResult['category']
    }
  } catch (e) {
    console.error('[AI] Llama categorize failed:', (e as Error)?.message)
  }

  return { category, sentiment, confidence }
}

/**
 * Generate a human-friendly markdown changelog from raw commit messages.
 * Returns a plain-text fallback if AI fails.
 */
export async function generateChangelog(
  ai: AiBinding,
  commits: string[],
): Promise<string> {
  if (commits.length === 0) return '- No changes recorded.'

  try {
    const commitList = commits.slice(0, 50).map((c, i) => `${i + 1}. ${c}`).join('\n')
    const messages = [
      {
        role: 'system',
        content:
          'You are a technical writer. Convert the following git commit messages into a clean, ' +
          'user-friendly markdown changelog. Group related changes under headings like ' +
          '## Bug Fixes, ## New Features, ## Improvements. Use bullet points. ' +
          'Write for end users, not developers. Be concise.',
      },
      {
        role: 'user',
        content: `Commits:\n${commitList}`,
      },
    ]
    const res  = await ai.run('@cf/meta/llama-3.1-8b-instruct', { messages })
    const text = extractText(res).trim()
    return text || commits.map(c => `- ${c}`).join('\n')
  } catch (e) {
    console.error('[AI] generateChangelog failed:', (e as Error)?.message)
    // Fallback: format commits as a simple list
    return commits.map(c => `- ${c}`).join('\n')
  }
}

/**
 * Summarize a list of feedback rows into a digest string.
 * Returns a plain summary if AI fails.
 */
export async function summarizeFeedback(
  ai: AiBinding,
  feedbackRows: { description: string; category: string }[],
): Promise<string> {
  if (feedbackRows.length === 0) return 'No feedback to summarize.'

  try {
    const sample = feedbackRows.slice(0, 30)
    const formatted = sample
      .map((r, i) => `${i + 1}. [${r.category}] ${r.description}`)
      .join('\n')

    const messages = [
      {
        role: 'system',
        content:
          'You are a product analyst. Summarize the following user feedback into a concise digest ' +
          'of the top issues and themes. Highlight the most common problems and any urgent items. ' +
          'Keep it under 300 words. Use bullet points.',
      },
      {
        role: 'user',
        content: `Feedback (${feedbackRows.length} total, showing ${sample.length}):\n${formatted}`,
      },
    ]
    const res  = await ai.run('@cf/meta/llama-3.1-8b-instruct', { messages })
    const text = extractText(res).trim()
    return text || `${feedbackRows.length} feedback items received. Top categories: ${[...new Set(feedbackRows.map(r => r.category))].join(', ')}.`
  } catch (e) {
    console.error('[AI] summarizeFeedback failed:', (e as Error)?.message)
    const categories = feedbackRows.reduce<Record<string, number>>((acc, r) => {
      acc[r.category] = (acc[r.category] ?? 0) + 1
      return acc
    }, {})
    const summary = Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, count]) => `- ${cat}: ${count}`)
      .join('\n')
    return `${feedbackRows.length} feedback items.\n${summary}`
  }
}

/**
 * Detect if a download pattern is anomalous.
 * Returns { anomaly: false } as a safe fallback if AI fails.
 */
export async function detectAnomaly(
  ai: AiBinding,
  stats: { hour: string; count: number }[],
): Promise<AnomalyResult> {
  const fallback: AnomalyResult = { anomaly: false, reason: 'Unable to analyze — AI unavailable.' }

  if (stats.length === 0) return { anomaly: false, reason: 'No data to analyze.' }

  try {
    const dataStr = stats.map(s => `${s.hour}: ${s.count} downloads`).join('\n')
    const messages = [
      {
        role: 'system',
        content:
          'You are a security analyst monitoring download patterns. ' +
          'Analyze the hourly download counts and determine if there is an anomaly ' +
          '(e.g. sudden spike, bot traffic, DDoS pattern). ' +
          'Respond with ONLY a JSON object: {"anomaly": true|false, "reason": "<brief explanation>"}. ' +
          'No other text.',
      },
      {
        role: 'user',
        content: `Hourly download stats:\n${dataStr}`,
      },
    ]
    const res    = await ai.run('@cf/meta/llama-3.1-8b-instruct', { messages })
    const text   = extractText(res)
    const parsed = extractJson<{ anomaly: boolean; reason: string }>(text)
    if (parsed && typeof parsed.anomaly === 'boolean') {
      return { anomaly: parsed.anomaly, reason: parsed.reason ?? 'No reason provided.' }
    }
    return fallback
  } catch (e) {
    console.error('[AI] detectAnomaly failed:', (e as Error)?.message)
    return fallback
  }
}

/**
 * Generate a beautiful HTML email body for a new release announcement.
 * Returns a plain-text HTML fallback if AI fails.
 */
export async function generateReleaseEmail(
  ai: AiBinding,
  release: { version: string; changelog: string; date: string },
): Promise<string> {
  const plainFallback = `
    <html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h1 style="color:#6366f1">🎉 OTYA Player ${release.version} is here!</h1>
      <p>We're excited to announce a new release of OTYA Player.</p>
      <h2>What's New</h2>
      <pre style="background:#f4f4f4;padding:16px;border-radius:8px">${release.changelog}</pre>
      <p>Released: ${release.date}</p>
      <a href="https://petersmartlink.com/download"
         style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">
        Download Now
      </a>
      <p style="color:#888;font-size:12px;margin-top:32px">
        You're receiving this because you subscribed to OTYA Player updates.
      </p>
    </body></html>
  `.trim()

  try {
    const messages = [
      {
        role: 'system',
        content:
          'You are an email copywriter. Write a beautiful, engaging HTML email body for a mobile app release announcement. ' +
          'Use inline CSS for styling. Include a header, brief intro, changelog section, and a download CTA button. ' +
          'The app is OTYA Player — a media player app. Keep it professional and exciting. ' +
          'Return ONLY the HTML body content (no <html> or <head> tags needed, just the body content). ' +
          'Use a purple/indigo color scheme (#6366f1).',
      },
      {
        role: 'user',
        content: `Version: ${release.version}\nDate: ${release.date}\nChangelog:\n${release.changelog}`,
      },
    ]
    const res  = await ai.run('@cf/meta/llama-3.1-8b-instruct', { messages })
    const text = extractText(res).trim()
    if (text && text.length > 100) {
      return `<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">${text}</body></html>`
    }
    return plainFallback
  } catch (e) {
    console.error('[AI] generateReleaseEmail failed:', (e as Error)?.message)
    return plainFallback
  }
}

/**
 * Decide if force_update should be set to 1 based on device version distribution.
 * Returns { force: false } as a safe fallback if AI fails.
 */
export async function shouldForceUpdate(
  ai: AiBinding,
  devices: { version_code: number; count: number }[],
  latestVersionCode: number,
): Promise<ForceUpdateResult> {
  const fallback: ForceUpdateResult = { force: false, reason: 'AI unavailable — defaulting to no force update.' }

  if (devices.length === 0) return { force: false, reason: 'No device data available.' }

  try {
    const totalDevices = devices.reduce((sum, d) => sum + d.count, 0)
    const outdated     = devices
      .filter(d => d.version_code < latestVersionCode)
      .reduce((sum, d) => sum + d.count, 0)
    const outdatedPct  = totalDevices > 0 ? Math.round((outdated / totalDevices) * 100) : 0

    const dataStr = devices
      .map(d => `version_code=${d.version_code}: ${d.count} devices`)
      .join('\n')

    const messages = [
      {
        role: 'system',
        content:
          'You are a mobile app release manager. Decide if a force update should be triggered. ' +
          'Consider: security fixes, critical bugs, and the percentage of outdated devices. ' +
          'Force update if >60% of devices are outdated OR if there are known critical issues. ' +
          'Respond with ONLY a JSON object: {"force": true|false, "reason": "<brief explanation>"}. ' +
          'No other text.',
      },
      {
        role: 'user',
        content:
          `Latest version_code: ${latestVersionCode}\n` +
          `Total devices: ${totalDevices}\n` +
          `Outdated devices: ${outdated} (${outdatedPct}%)\n` +
          `Distribution:\n${dataStr}`,
      },
    ]
    const res    = await ai.run('@cf/meta/llama-3.1-8b-instruct', { messages })
    const text   = extractText(res)
    const parsed = extractJson<{ force: boolean; reason: string }>(text)
    if (parsed && typeof parsed.force === 'boolean') {
      return { force: parsed.force, reason: parsed.reason ?? 'No reason provided.' }
    }
    return fallback
  } catch (e) {
    console.error('[AI] shouldForceUpdate failed:', (e as Error)?.message)
    return fallback
  }
}
