/**
 * Wrangler entrypoint for otya-store.
 *
 * Wraps the OpenNext worker (which handles all HTTP/fetch traffic) and adds a
 * queue() handler so the [[queues.consumers]] binding in wrangler.toml can be
 * satisfied.  Without this handler Cloudflare refuses to register the consumer
 * and the deploy fails with:
 *   ✘ [ERROR] Some triggers failed to deploy for otya-store:
 *       - A request to the Cloudflare API (/accounts/.../queues/.../consumers) failed.
 *
 * Build order (package.json "deploy" script):
 *   1. opennextjs-cloudflare build  →  produces .open-next/worker.js
 *   2. wrangler deploy              →  bundles THIS file (which imports the
 *                                      above artifact) and deploys
 */
import openNextWorker from '../.open-next/worker.js'

export default {
  // ── HTTP handler — delegate entirely to OpenNext ──────────────────────────
  fetch: openNextWorker.fetch.bind(openNextWorker),

  // ── Queue consumer — process push AND AI queue messages ───────────────────
  async queue(batch, env, ctx) {
    for (const message of batch.messages) {
      try {
        // Route by queue name
        if (batch.queue === 'otya-ai-queue') {
          await handleAiMessage(message.body, env, ctx)
        } else {
          // Default: otya-push-queue
          await handlePushMessage(message.body, env)
        }
        message.ack()
      } catch (e) {
        console.error(`[${batch.queue}] Failed to process message:`, e?.message ?? e)
        message.retry()
      }
    }
  },

  // ── Scheduled cron handler ────────────────────────────────────────────────
  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleScheduled(event.cron, env))
  },
}

// ── AI queue message handler ──────────────────────────────────────────────────

/**
 * Handle messages from the otya-ai-queue.
 *
 * Supported message types:
 *   categorize_feedback   — run AI categorization, update D1 feedback row
 *   process_crash         — group crash with similar ones via Vectorize, update D1
 *   send_update_notification — send FCM to all devices (or a specific device)
 *   generate_changelog    — generate changelog for a release, update D1 releases row
 *   analyze_anomaly       — check download stats for anomalies, send alert if found
 *
 * @param {{ type: string, [key: string]: unknown }} msg
 * @param {Record<string, unknown>} env
 * @param {ExecutionContext} ctx
 */
async function handleAiMessage(msg, env, ctx) {
  const { type } = msg
  console.log(`[AI_QUEUE] Processing message type: ${type}`)

  switch (type) {
    case 'categorize_feedback':
      await handleCategorizeFeedback(msg, env)
      break

    case 'process_crash':
      await handleProcessCrash(msg, env)
      break

    case 'send_update_notification':
      await handleSendUpdateNotification(msg, env)
      break

    case 'generate_changelog':
      await handleGenerateChangelog(msg, env)
      break

    case 'analyze_anomaly':
      await handleAnalyzeAnomaly(msg, env)
      break

    case 'moderate_feedback':
      await handleModerateFeedback(msg, env)
      break

    case 'predict_churn':
      await handlePredictChurn(msg, env)
      break

    case 'generate_smart_reply':
      await handleGenerateSmartReply(msg, env)
      break

    default:
      console.warn('[AI_QUEUE] Unknown message type:', type)
  }
}

/** Categorize a feedback row using AI and update D1. */
async function handleCategorizeFeedback(msg, env) {
  const { feedbackId, description } = msg
  if (!feedbackId || !description) {
    console.error('[AI_QUEUE] categorize_feedback: missing feedbackId or description')
    return
  }

  try {
    // ── Sentiment via DistilBERT ──────────────────────────────────────────
    let sentiment  = 'NEUTRAL'
    let confidence = 0
    try {
      const sentimentRes = await env.AI.run('@cf/huggingface/distilbert-sst-2-int8', {
        text: String(description).substring(0, 512),
      })
      const results = Array.isArray(sentimentRes) ? sentimentRes : []
      const top = results.sort((a, b) => b.score - a.score)[0]
      if (top) {
        sentiment  = top.label === 'POSITIVE' ? 'POSITIVE' : 'NEGATIVE'
        confidence = Math.round(top.score * 100) / 100
      }
    } catch (e) {
      console.error('[AI_QUEUE] DistilBERT failed:', e?.message)
    }

    // ── Category via Llama ────────────────────────────────────────────────
    let category = 'complaint'
    try {
      const llmRes = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          {
            role: 'system',
            content:
              'You are a feedback classifier. Classify the user feedback into exactly one of these categories: ' +
              'bug, feature_request, complaint, praise, crash_report. ' +
              'Respond with ONLY a JSON object: {"category": "<value>"}. No explanation.',
          },
          {
            role: 'user',
            content: `Feedback: "${String(description).substring(0, 800)}"`,
          },
        ],
      })
      const text = extractAiText(llmRes)
      const parsed = safeParseJson(text)
      const valid = ['bug', 'feature_request', 'complaint', 'praise', 'crash_report']
      if (parsed?.category && valid.includes(parsed.category)) {
        category = parsed.category
      }
    } catch (e) {
      console.error('[AI_QUEUE] Llama categorize failed:', e?.message)
    }

    // ── Update D1 ─────────────────────────────────────────────────────────
    await env.DB.prepare(`
      UPDATE feedback
      SET category = ?, sentiment = ?, ai_processed = 1
      WHERE id = ?
    `).bind(category, sentiment, feedbackId).run()

    console.log(`[AI_QUEUE] Feedback ${feedbackId} categorized: ${category} / ${sentiment} (${confidence})`)
  } catch (e) {
    console.error('[AI_QUEUE] handleCategorizeFeedback failed:', e?.message)
    throw e   // let the queue retry
  }
}

/** Group a crash report with similar ones via Vectorize and update D1. */
async function handleProcessCrash(msg, env) {
  const { crashId, errorType, stackTrace, description } = msg
  if (!crashId) {
    console.error('[AI_QUEUE] process_crash: missing crashId')
    return
  }

  try {
    // ── Generate embedding for the crash ──────────────────────────────────
    const crashText = [errorType, description, stackTrace]
      .filter(Boolean)
      .join('\n')
      .substring(0, 1000)

    let groupId = null
    try {
      const embeddingRes = await env.AI.run('@cf/baai/bge-small-en-v1.5', {
        text: [crashText],
      })
      const vector = embeddingRes?.data?.[0]

      if (vector && Array.isArray(vector)) {
        // ── Query Vectorize for similar crashes ───────────────────────────
        const queryRes = await env.VECTORIZE.query(vector, { topK: 3 })
        const topMatch = queryRes?.matches?.[0]

        if (topMatch && topMatch.score > 0.85) {
          // Similar crash found — use its group ID
          groupId = topMatch.metadata?.groupId ?? topMatch.id
          console.log(`[AI_QUEUE] Crash ${crashId} grouped with ${topMatch.id} (score: ${topMatch.score})`)
        } else {
          // New crash group — use crashId as the group ID
          groupId = String(crashId)
        }

        // ── Upsert vector into Vectorize ──────────────────────────────────
        await env.VECTORIZE.upsert([{
          id:       String(crashId),
          values:   vector,
          metadata: { groupId, errorType: errorType ?? 'unknown', crashId: String(crashId) },
        }])
      }
    } catch (e) {
      console.error('[AI_QUEUE] Vectorize operation failed:', e?.message)
      groupId = String(crashId)   // fallback: own group
    }

    // ── Update D1 crash_reports row ───────────────────────────────────────
    await env.DB.prepare(`
      UPDATE crash_reports
      SET group_id = ?, ai_processed = 1
      WHERE id = ?
    `).bind(groupId, crashId).run()

    console.log(`[AI_QUEUE] Crash ${crashId} processed, group: ${groupId}`)
  } catch (e) {
    console.error('[AI_QUEUE] handleProcessCrash failed:', e?.message)
    throw e
  }
}

/** Send FCM update notification to all devices (or a specific device). */
async function handleSendUpdateNotification(msg, env) {
  const { version, changelog, deviceId } = msg
  try {
    await env.PUSH_QUEUE.send({
      title:    `🎉 OTYA Player ${version ?? 'update'} is available!`,
      body:     changelog
        ? changelog.replace(/[#*`]/g, '').split('\n').find(l => l.trim()) ?? 'New update available.'
        : 'A new version of OTYA Player is ready to download.',
      url:      'https://petersmartlink.com/download',
      ...(deviceId ? { deviceId } : {}),
    })
    console.log(`[AI_QUEUE] Queued update notification for ${version}${deviceId ? ` → device ${deviceId}` : ' → all devices'}`)
  } catch (e) {
    console.error('[AI_QUEUE] handleSendUpdateNotification failed:', e?.message)
    throw e
  }
}

/** Generate a changelog for a release using Llama and update D1. */
async function handleGenerateChangelog(msg, env) {
  const { tag, commits } = msg
  if (!tag) {
    console.error('[AI_QUEUE] generate_changelog: missing tag')
    return
  }

  try {
    let changelog = (commits ?? []).map(c => `- ${c}`).join('\n') || '- No changes recorded.'

    try {
      const commitList = (commits ?? []).slice(0, 50).map((c, i) => `${i + 1}. ${c}`).join('\n')
      const llmRes = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
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
        ],
      })
      const text = extractAiText(llmRes).trim()
      if (text && text.length > 20) changelog = text
    } catch (e) {
      console.error('[AI_QUEUE] Llama changelog generation failed:', e?.message)
    }

    await env.DB.prepare(`
      UPDATE releases SET changelog = ? WHERE tag = ?
    `).bind(changelog, tag).run()

    console.log(`[AI_QUEUE] Changelog generated for release ${tag}`)
  } catch (e) {
    console.error('[AI_QUEUE] handleGenerateChangelog failed:', e?.message)
    throw e
  }
}

/** Check download stats for anomalies and send an alert if found. */
async function handleAnalyzeAnomaly(msg, env) {
  try {
    // Fetch last 24 hours of hourly download counts
    const { results } = await env.DB.prepare(`
      SELECT strftime('%Y-%m-%d %H:00', created_at) as hour, COUNT(*) as count
      FROM downloads
      WHERE created_at >= datetime('now', '-24 hours')
      GROUP BY hour
      ORDER BY hour ASC
    `).all()

    if (!results || results.length === 0) {
      console.log('[AI_QUEUE] No download data for anomaly analysis.')
      return
    }

    let anomaly = false
    let reason  = 'No anomaly detected.'

    try {
      const dataStr = results.map(s => `${s.hour}: ${s.count} downloads`).join('\n')
      const llmRes  = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
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
        ],
      })
      const text   = extractAiText(llmRes)
      const parsed = safeParseJson(text)
      if (parsed && typeof parsed.anomaly === 'boolean') {
        anomaly = parsed.anomaly
        reason  = parsed.reason ?? reason
      }
    } catch (e) {
      console.error('[AI_QUEUE] Llama anomaly detection failed:', e?.message)
    }

    if (anomaly) {
      console.warn('[AI_QUEUE] Anomaly detected:', reason)
      try {
        await env.EMAIL.send({
          from:    { email: 'worker@petersmartlink.com', name: 'Otya Store Worker' },
          to:      [{ email: 'petersmartlink@gmail.com' }],
          subject: '[Otya Store] ⚠️ Download Anomaly Detected',
          text:    `Anomaly detected in download patterns.\n\nReason: ${reason}\n\nTime: ${new Date().toISOString()}`,
        })
      } catch (e) {
        console.error('[AI_QUEUE] Failed to send anomaly alert email:', e?.message)
      }
    } else {
      console.log('[AI_QUEUE] No anomaly detected:', reason)
    }
  } catch (e) {
    console.error('[AI_QUEUE] handleAnalyzeAnomaly failed:', e?.message)
    throw e
  }
}

// ── Scheduled cron handler ────────────────────────────────────────────────────

/**
 * Handle cron triggers.
 *
 * Cron schedule:
 *   "*/5 * * * *"  — every 5 minutes: health check all endpoints
 *   "0 * * * *"    — every hour: detect rate-limit abuse; at midnight send daily report
 *   "0 6 * * 1"    — Monday 6am: send weekly digest email
 *
 * @param {string} cron
 * @param {Record<string, unknown>} env
 */
async function handleScheduled(cron, env) {
  console.log(`[CRON] Triggered: ${cron}`)

  // ── Ensure AI tables exist (idempotent) ───────────────────────────────────
  try {
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS crash_reports (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id    TEXT,
        app_version  TEXT,
        version_code INTEGER,
        error_type   TEXT,
        stack_trace  TEXT,
        description  TEXT,
        group_id     TEXT,
        ai_processed INTEGER DEFAULT 0,
        created_at   TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_crash_created  ON crash_reports(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_crash_group    ON crash_reports(group_id);
      CREATE INDEX IF NOT EXISTS idx_crash_device   ON crash_reports(device_id);
    `)
    // Add AI columns to feedback table if they don't exist yet
    // SQLite doesn't support IF NOT EXISTS for columns — use try/catch per column
    for (const col of [
      'ALTER TABLE feedback ADD COLUMN sentiment TEXT',
      'ALTER TABLE feedback ADD COLUMN ai_processed INTEGER DEFAULT 0',
    ]) {
      try { await env.DB.exec(col) } catch { /* column already exists */ }
    }
    // Add model/android_version/locale columns to devices if missing
    for (const col of [
      'ALTER TABLE devices ADD COLUMN model TEXT',
      'ALTER TABLE devices ADD COLUMN android_version TEXT',
      'ALTER TABLE devices ADD COLUMN locale TEXT',
    ]) {
      try { await env.DB.exec(col) } catch { /* column already exists */ }
    }

    // New tables: feedback_replies, user_preferences, bookmarks, eq_presets
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS feedback_replies (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        feedback_id  INTEGER NOT NULL,
        reply_text   TEXT NOT NULL,
        generated_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_feedback_replies_fid ON feedback_replies(feedback_id);
    `)
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        user_id      TEXT PRIMARY KEY,
        theme        TEXT,
        accent_color TEXT,
        updated_at   TEXT DEFAULT (datetime('now'))
      );
    `)
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id           TEXT PRIMARY KEY,
        user_id      TEXT NOT NULL,
        media_id     TEXT NOT NULL,
        file_path    TEXT,
        position_ms  INTEGER DEFAULT 0,
        duration_ms  INTEGER DEFAULT 0,
        title        TEXT,
        updated_at   TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_bookmarks_user  ON bookmarks(user_id);
      CREATE INDEX IF NOT EXISTS idx_bookmarks_media ON bookmarks(user_id, media_id);
    `)
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS eq_presets (
        id           TEXT PRIMARY KEY,
        user_id      TEXT NOT NULL,
        preset_name  TEXT NOT NULL,
        bands        TEXT NOT NULL DEFAULT '[]',
        is_default   INTEGER DEFAULT 0,
        created_at   TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_eq_presets_user ON eq_presets(user_id);
    `)
  } catch (e) {
    console.error('[CRON] ensureAiTables failed:', e?.message)
  }

  if (cron === '*/5 * * * *') {
    // ── Every 5 minutes: health check ────────────────────────────────────
    await runHealthCheck(env)

  } else if (cron === '0 * * * *') {
    // ── Every hour: rate-limit abuse detection ────────────────────────────
    await runAbuseDetection(env)

    // At midnight UTC: send daily abuse report
    const hour = new Date().getUTCHours()
    if (hour === 0) {
      await sendDailyAbuseReport(env)
    }

  } else if (cron === '0 6 * * 1') {
    // ── Monday 6am: weekly digest ─────────────────────────────────────────
    await sendWeeklyDigest(env)

  } else if (cron === '0 9 * * *') {
    // ── Daily 9am: churn prediction for at-risk users ─────────────────────
    await runChurnPrediction(env)

  } else {
    console.warn('[CRON] Unknown cron expression:', cron)
  }
}

/**
 * Query users who were last seen 7–14 days ago and queue churn prediction for each.
 * Runs daily at 9am UTC.
 */
async function runChurnPrediction(env) {
  try {
    // Find distinct user_ids from devices last seen 7–14 days ago
    const { results } = await env.DB.prepare(`
      SELECT DISTINCT user_id
      FROM devices
      WHERE user_id IS NOT NULL
        AND last_seen_at >= datetime('now', '-14 days')
        AND last_seen_at <  datetime('now', '-7 days')
      LIMIT 500
    `).all()

    if (!results || results.length === 0) {
      console.log('[CRON] Churn prediction: no at-risk users found.')
      return
    }

    let queued = 0
    for (const row of results) {
      try {
        await env.AI_QUEUE.send({ type: 'predict_churn', user_id: row.user_id })
        queued++
      } catch (e) {
        console.error('[CRON] Failed to queue churn prediction for', row.user_id, e?.message)
      }
    }

    console.log(`[CRON] Churn prediction: queued ${queued} of ${results.length} users.`)
  } catch (e) {
    console.error('[CRON] runChurnPrediction failed:', e?.message)
  }
}

/** Ping all key endpoints and send an alert if any are down. */
async function runHealthCheck(env) {
  const endpoints = [
    'https://petersmartlink.com',
    'https://petersmartlink.com/download',
    'https://petersmartlink.com/version',
    'https://petersmartlink.com/latest',
  ]

  const results = await Promise.all(
    endpoints.map(async (url) => {
      const start = Date.now()
      try {
        const res = await fetch(url, {
          method:  'HEAD',
          signal:  AbortSignal.timeout(8000),
          headers: { 'User-Agent': 'OtyaStore-HealthCheck/1.0' },
        })
        return { url, status: res.status, latency: Date.now() - start, ok: res.ok }
      } catch (e) {
        return { url, status: 0, latency: Date.now() - start, ok: false, error: e?.message }
      }
    }),
  )

  const down = results.filter(r => !r.ok)
  if (down.length > 0) {
    console.warn('[CRON] Health check: endpoints down:', down.map(r => r.url).join(', '))
    try {
      const body = [
        '⚠️ Endpoint Health Alert',
        '',
        ...down.map(r => `❌ ${r.url} — status ${r.status}, latency ${r.latency}ms${r.error ? ` (${r.error})` : ''}`),
        '',
        `Checked at: ${new Date().toISOString()}`,
      ].join('\n')

      await env.EMAIL.send({
        from:    { email: 'worker@petersmartlink.com', name: 'Otya Store Worker' },
        to:      [{ email: 'petersmartlink@gmail.com' }],
        subject: `[Otya Store] ⚠️ ${down.length} endpoint(s) down`,
        text:    body,
      })
    } catch (e) {
      console.error('[CRON] Failed to send health alert email:', e?.message)
    }
  } else {
    console.log('[CRON] Health check: all endpoints OK')
  }
}

/** Detect IPs with >100 requests in the last hour and block them in KV. */
async function runAbuseDetection(env) {
  try {
    const { results } = await env.DB.prepare(`
      SELECT ip, COUNT(*) as count
      FROM downloads
      WHERE created_at >= datetime('now', '-1 hour')
        AND ip IS NOT NULL
        AND ip != 'unknown'
      GROUP BY ip
      HAVING count > 100
      ORDER BY count DESC
      LIMIT 50
    `).all()

    if (!results || results.length === 0) {
      console.log('[CRON] Abuse detection: no abusive IPs found.')
      return
    }

    for (const row of results) {
      try {
        await env.KV.put(`blocked:${row.ip}`, '1', { expirationTtl: 86400 })
        console.log(`[CRON] Blocked IP: ${row.ip} (${row.count} requests/hour)`)
      } catch (e) {
        console.error('[CRON] Failed to block IP', row.ip, e?.message)
      }
    }

    console.log(`[CRON] Abuse detection: blocked ${results.length} IPs.`)
  } catch (e) {
    console.error('[CRON] runAbuseDetection failed:', e?.message)
  }
}

/** Send a daily abuse report email at midnight. */
async function sendDailyAbuseReport(env) {
  try {
    // Count blocked IPs in KV (list with prefix)
    const { keys } = await env.KV.list({ prefix: 'blocked:', limit: 1000 })
    const blockedCount = keys.length

    // Count downloads in last 24h
    const row = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM downloads WHERE created_at >= datetime('now', '-1 day')"
    ).first()
    const downloads24h = row?.count ?? 0

    const body = [
      '📊 Daily Abuse Report',
      '',
      `Currently blocked IPs : ${blockedCount}`,
      `Downloads (last 24h)  : ${downloads24h}`,
      '',
      `Generated: ${new Date().toISOString()}`,
    ].join('\n')

    await env.EMAIL.send({
      from:    { email: 'worker@petersmartlink.com', name: 'Otya Store Worker' },
      to:      [{ email: 'petersmartlink@gmail.com' }],
      subject: `[Otya Store] Daily Abuse Report — ${new Date().toDateString()}`,
      text:    body,
    })
    console.log('[CRON] Daily abuse report sent.')
  } catch (e) {
    console.error('[CRON] sendDailyAbuseReport failed:', e?.message)
  }
}

/** Compile and send the weekly digest email. */
async function sendWeeklyDigest(env) {
  try {
    // ── Gather stats ──────────────────────────────────────────────────────
    const [totalRow, last24hRow, last7dRow, topAbiRow, topVersionRow, activeRow, feedbackRows] =
      await Promise.all([
        env.DB.prepare('SELECT COUNT(*) as count FROM downloads').first(),
        env.DB.prepare("SELECT COUNT(*) as count FROM downloads WHERE created_at >= datetime('now', '-1 day')").first(),
        env.DB.prepare("SELECT COUNT(*) as count FROM downloads WHERE created_at >= datetime('now', '-7 days')").first(),
        env.DB.prepare('SELECT abi, COUNT(*) as count FROM downloads GROUP BY abi ORDER BY count DESC LIMIT 1').first(),
        env.DB.prepare('SELECT version, COUNT(*) as count FROM downloads GROUP BY version ORDER BY count DESC LIMIT 1').first(),
        env.DB.prepare("SELECT COUNT(*) as count FROM devices WHERE last_seen_at >= datetime('now', '-30 days')").first(),
        env.DB.prepare("SELECT description, category FROM feedback WHERE created_at >= datetime('now', '-7 days') LIMIT 30").all(),
      ])

    // ── Summarize feedback via AI ─────────────────────────────────────────
    let feedbackSummary = 'No feedback this week.'
    const feedbackList  = feedbackRows?.results ?? []
    if (feedbackList.length > 0) {
      try {
        const formatted = feedbackList
          .map((r, i) => `${i + 1}. [${r.category ?? 'unknown'}] ${r.description}`)
          .join('\n')
        const llmRes = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
          messages: [
            {
              role: 'system',
              content:
                'You are a product analyst. Summarize the following user feedback into a concise digest ' +
                'of the top issues and themes. Keep it under 200 words. Use bullet points.',
            },
            {
              role: 'user',
              content: `Feedback (${feedbackList.length} items):\n${formatted}`,
            },
          ],
        })
        const text = extractAiText(llmRes).trim()
        if (text) feedbackSummary = text
      } catch (e) {
        console.error('[CRON] AI feedback summary failed:', e?.message)
        feedbackSummary = `${feedbackList.length} feedback items received this week.`
      }
    }

    const body = [
      '=== OTYA Store Weekly Digest ===',
      '',
      '📊 Download Stats',
      `  Total downloads : ${totalRow?.count ?? 0}`,
      `  Last 24 hours   : ${last24hRow?.count ?? 0}`,
      `  Last 7 days     : ${last7dRow?.count ?? 0}`,
      `  Top ABI         : ${topAbiRow?.abi ?? 'unknown'}`,
      `  Top version     : ${topVersionRow?.version ?? 'unknown'}`,
      `  Active devices  : ${activeRow?.count ?? 0}`,
      '',
      '💬 Feedback Summary (last 7 days)',
      feedbackSummary,
      '',
      `Generated: ${new Date().toISOString()}`,
    ].join('\n')

    await env.EMAIL.send({
      from:    { email: 'worker@petersmartlink.com', name: 'Otya Store Worker' },
      to:      [{ email: 'petersmartlink@gmail.com' }],
      subject: `[Otya Store] Weekly Digest — ${new Date().toDateString()}`,
      text:    body,
    })
    console.log('[CRON] Weekly digest sent.')
  } catch (e) {
    console.error('[CRON] sendWeeklyDigest failed:', e?.message)
  }
}

/** Run AI moderation on a feedback item; delete it from D1 if it fails. */
async function handleModerateFeedback(msg, env) {
  const { feedbackId, description } = msg
  if (!feedbackId || !description) {
    console.error('[AI_QUEUE] moderate_feedback: missing feedbackId or description')
    return
  }

  try {
    let ok     = true
    let reason = ''

    try {
      const llmRes = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          {
            role: 'system',
            content:
              'You are a content moderator for a mobile app feedback system. ' +
              'Determine if the following text is spam, abusive, or inappropriate. ' +
              'Spam includes: repeated characters, gibberish, promotional content, links. ' +
              'Abusive includes: hate speech, threats, profanity. ' +
              'Respond with ONLY a JSON object: {"ok": true|false, "reason": "<brief reason if not ok>"}. ' +
              'If the content is legitimate feedback (even negative), return {"ok": true}. ' +
              'No other text.',
          },
          {
            role: 'user',
            content: `Feedback text: "${String(description).substring(0, 500)}"`,
          },
        ],
      })
      const text   = extractAiText(llmRes)
      const parsed = safeParseJson(text)
      if (parsed && typeof parsed.ok === 'boolean') {
        ok     = parsed.ok
        reason = parsed.reason ?? ''
      }
    } catch (e) {
      console.error('[AI_QUEUE] moderate_feedback AI call failed:', e?.message)
      // Fail open — don't delete feedback if AI is unavailable
      return
    }

    if (!ok) {
      console.warn(`[AI_QUEUE] Feedback ${feedbackId} flagged as spam/abuse: ${reason}`)
      await env.DB.prepare('DELETE FROM feedback WHERE id = ?').bind(feedbackId).run()
      console.log(`[AI_QUEUE] Deleted feedback ${feedbackId} (reason: ${reason})`)
    } else {
      console.log(`[AI_QUEUE] Feedback ${feedbackId} passed moderation.`)
    }
  } catch (e) {
    console.error('[AI_QUEUE] handleModerateFeedback failed:', e?.message)
    throw e
  }
}

/** Predict churn risk for a user; if high risk, queue a personalized re-engagement push. */
async function handlePredictChurn(msg, env) {
  const { user_id } = msg
  if (!user_id) {
    console.error('[AI_QUEUE] predict_churn: missing user_id')
    return
  }

  try {
    // Fetch user stats from D1
    const device = await env.DB.prepare(`
      SELECT last_seen_at FROM devices WHERE user_id = ? ORDER BY last_seen_at DESC LIMIT 1
    `).bind(user_id).first()

    const proRow = await env.DB.prepare(
      'SELECT expiry_ms FROM pro_status WHERE user_id = ?'
    ).bind(user_id).first()

    const playRow = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM play_history WHERE user_id = ?'
    ).bind(user_id).first()

    const lastSeenAt = device?.last_seen_at ?? new Date(0).toISOString()
    const proExpiry  = proRow?.expiry_ms ?? null
    const playCount  = playRow?.count ?? 0

    const daysSinceLastSeen = Math.floor(
      (Date.now() - new Date(lastSeenAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    const proExpired = proExpiry != null && proExpiry < Date.now()

    let risk   = 'low'
    let reason = 'User appears active.'

    try {
      const llmRes = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          {
            role: 'system',
            content:
              'You are a user retention analyst for a mobile media player app. ' +
              'Predict the churn risk for a user based on their activity. ' +
              'Respond with ONLY a JSON object: {"risk": "high"|"medium"|"low", "reason": "<brief explanation>"}. ' +
              'No other text.',
          },
          {
            role: 'user',
            content:
              `Days since last seen: ${daysSinceLastSeen}\n` +
              `Pro subscription expired: ${proExpired}\n` +
              `Total play count: ${playCount}`,
          },
        ],
      })
      const text   = extractAiText(llmRes)
      const parsed = safeParseJson(text)
      if (parsed && ['high', 'medium', 'low'].includes(parsed.risk)) {
        risk   = parsed.risk
        reason = parsed.reason ?? reason
      }
    } catch (e) {
      console.error('[AI_QUEUE] predict_churn AI call failed:', e?.message)
    }

    console.log(`[AI_QUEUE] Churn prediction for ${user_id}: ${risk} — ${reason}`)

    // If high risk, queue a personalized re-engagement push notification
    if (risk === 'high') {
      try {
        // Fetch listening history for personalization
        const historyRows = await env.DB.prepare(`
          SELECT title, artist FROM play_history WHERE user_id = ? ORDER BY last_played_at DESC LIMIT 20
        `).bind(user_id).all()

        const artists = [...new Set(
          (historyRows?.results ?? [])
            .map(r => r.artist)
            .filter(Boolean)
        )].slice(0, 3)

        // Generate personalized notification text
        let title = '🎵 We miss you!'
        let body  = 'Come back and enjoy your music with OTYA Player.'

        try {
          const artistStr = artists.length > 0 ? artists.join(', ') : 'your favorite artists'
          const notifRes  = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
            messages: [
              {
                role: 'system',
                content:
                  'You are a copywriter for a mobile music player app called OTYA Player. ' +
                  'Write a short, personalized push notification to re-engage a user. ' +
                  'Respond with ONLY a JSON object: {"title": "<max 50 chars>", "body": "<max 100 chars>"}. ' +
                  'No other text.',
              },
              {
                role: 'user',
                content: `Favorite artists: ${artistStr}.`,
              },
            ],
          })
          const notifText   = extractAiText(notifRes)
          const notifParsed = safeParseJson(notifText)
          if (notifParsed?.title && notifParsed?.body) {
            title = String(notifParsed.title).substring(0, 50)
            body  = String(notifParsed.body).substring(0, 100)
          }
        } catch (e) {
          console.error('[AI_QUEUE] personalized notification generation failed:', e?.message)
        }

        await env.PUSH_QUEUE.send({ title, body, user_id })
        console.log(`[AI_QUEUE] Queued re-engagement push for high-churn user ${user_id}`)
      } catch (e) {
        console.error('[AI_QUEUE] Failed to queue re-engagement push:', e?.message)
      }
    }
  } catch (e) {
    console.error('[AI_QUEUE] handlePredictChurn failed:', e?.message)
    throw e
  }
}

/** Generate an AI smart reply for a feedback item and store it in D1. */
async function handleGenerateSmartReply(msg, env) {
  const { feedbackId, description, category } = msg
  if (!feedbackId || !description) {
    console.error('[AI_QUEUE] generate_smart_reply: missing feedbackId or description')
    return
  }

  try {
    const feedbackCategory = category ?? 'complaint'
    let replyText = `Thank you for your feedback! We appreciate you taking the time to share your experience with OTYA Player. Our team will review your ${feedbackCategory} and work to improve the app.`

    try {
      const llmRes = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          {
            role: 'system',
            content:
              'You are a friendly and professional customer support agent for OTYA Player, a media player app. ' +
              'Write a concise, empathetic, and helpful reply to the user\'s feedback. ' +
              'Acknowledge their concern, thank them, and if applicable mention that the team will look into it. ' +
              'Keep the reply under 100 words. Do not use placeholders like [Name]. Be warm and genuine.',
          },
          {
            role: 'user',
            content: `Category: ${feedbackCategory}\nFeedback: "${String(description).substring(0, 800)}"`,
          },
        ],
      })
      const text = extractAiText(llmRes).trim()
      if (text) replyText = text
    } catch (e) {
      console.error('[AI_QUEUE] generate_smart_reply AI call failed:', e?.message)
    }

    // Ensure feedback_replies table exists
    try {
      await env.DB.exec(`
        CREATE TABLE IF NOT EXISTS feedback_replies (
          id           INTEGER PRIMARY KEY AUTOINCREMENT,
          feedback_id  INTEGER NOT NULL,
          reply_text   TEXT NOT NULL,
          generated_at TEXT DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_feedback_replies_fid ON feedback_replies(feedback_id);
      `)
    } catch { /* table already exists */ }

    await env.DB.prepare(`
      INSERT INTO feedback_replies (feedback_id, reply_text) VALUES (?, ?)
    `).bind(feedbackId, replyText).run()

    console.log(`[AI_QUEUE] Smart reply generated for feedback ${feedbackId}`)
  } catch (e) {
    console.error('[AI_QUEUE] handleGenerateSmartReply failed:', e?.message)
    throw e
  }
}

// ── Shared AI response helpers (plain JS — no imports) ────────────────────────

/** Extract text from whatever shape the AI binding returns. */
function extractAiText(response) {
  if (typeof response === 'string') return response
  if (response && typeof response === 'object') {
    if (typeof response.response === 'string')       return response.response
    if (typeof response.generated_text === 'string') return response.generated_text
    if (Array.isArray(response.result)) {
      const first = response.result[0]
      if (first && typeof first.generated_text === 'string') return first.generated_text
    }
  }
  return ''
}

/** Safely parse JSON from a freeform LLM response. */
function safeParseJson(text) {
  try { return JSON.parse(text) } catch { /* ignore */ }
  const match = text.match(/\{[\s\S]*?\}/)
  if (match) { try { return JSON.parse(match[0]) } catch { /* ignore */ } }
  return null
}

// ── Push message handler ──────────────────────────────────────────────────────

/**
 * @param {{ title: string, body: string, url?: string, deviceId?: string }} msg
 * @param {Record<string, unknown>} env
 */
async function handlePushMessage(msg, env) {
  const { title, body, url, deviceId } = msg

  if (!title || !body) throw new Error('Missing required fields: title, body')

  const serviceAccountJson = env.FCM_SERVICE_ACCOUNT_JSON
  if (!serviceAccountJson) throw new Error('FCM_SERVICE_ACCOUNT_JSON secret is not set')

  const sa = JSON.parse(serviceAccountJson)
  const accessToken = await getFcmAccessToken(serviceAccountJson)
  const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`
  const link = url ?? env.WEBSITE_URL ?? 'https://petersmartlink.com/download'

  // Resolve target FCM tokens from D1
  let tokens = []
  if (deviceId) {
    const row = await env.DB.prepare(
      'SELECT fcm_token FROM devices WHERE device_id = ? AND fcm_token IS NOT NULL',
    ).bind(deviceId).first()
    if (row?.fcm_token) tokens = [row.fcm_token]
  } else {
    // Paginate through all devices — no hardcoded cap so every user gets
    // notified regardless of database size.
    let offset = 0
    const pageSize = 1000
    while (true) {
      const { results } = await env.DB.prepare(
        'SELECT fcm_token FROM devices WHERE fcm_token IS NOT NULL LIMIT ? OFFSET ?',
      ).bind(pageSize, offset).all()
      tokens.push(...results.map(r => r.fcm_token))
      if (results.length < pageSize) break
      offset += pageSize
    }
  }

  if (tokens.length === 0) {
    console.log('[PUSH_QUEUE] No registered devices — skipping.')
    return
  }

  let sent = 0, failed = 0
  for (const token of tokens) {
    const res = await fetch(fcmEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          data: { url: link },
          android: { priority: 'high' },
        },
      }),
    })
    if (res.ok) sent++; else failed++
  }

  console.log(`[PUSH_QUEUE] Sent: ${sent}, Failed: ${failed}, Total: ${tokens.length}`)
}

// ── FCM helpers (plain JS — this file runs outside the Next.js bundler) ───────
// These mirror src/lib/fcm.ts exactly so there is a single source of truth for
// the algorithm; only the module format differs.

function base64urlEncode(buf) {
  const bytes = new Uint8Array(buf)
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function encodeUtf8(str) {
  const encoded = new TextEncoder().encode(str)
  return encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength)
}

async function getFcmAccessToken(serviceAccountJson) {
  const sa = JSON.parse(serviceAccountJson)
  const now = Math.floor(Date.now() / 1000)
  const tokenUri = sa.token_uri ?? 'https://oauth2.googleapis.com/token'

  const header  = base64urlEncode(encodeUtf8(JSON.stringify({ alg: 'RS256', typ: 'JWT' })))
  const payload = base64urlEncode(encodeUtf8(JSON.stringify({
    iss: sa.client_email,
    sub: sa.client_email,
    aud: tokenUri,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    iat: now,
    exp: now + 3600,
  })))

  const signingInput = `${header}.${payload}`

  const pemBody = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '')
  const derBytes = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0))

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    derBytes.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    encodeUtf8(signingInput),
  )

  const jwt = `${signingInput}.${base64urlEncode(signature)}`

  const tokenRes = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!tokenRes.ok) {
    throw new Error(`OAuth2 token exchange failed: ${tokenRes.status} ${await tokenRes.text()}`)
  }

  const data = await tokenRes.json()
  return data.access_token
}
