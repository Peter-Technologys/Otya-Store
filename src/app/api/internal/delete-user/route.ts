import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { secureJson, errorJson } from '@/lib/response'
import { getDB, type D1 } from '@/lib/d1'

// Durable Otya product datasets owned directly by the shared account ID.
// Table names are constants so they can be safely used in PRAGMA/DELETE SQL.
const USER_ID_TABLES = [
  'play_history',
  'playlists',
  'bookmarks',
  'eq_presets',
  'user_preferences',
  'pro_status',
  'ratings',
  'crash_reports',
  'devices',
] as const

type DeletedRow = { table: string; rows: number; skipped?: 'table-not-present' | 'no-account-email' }

async function tableColumns(db: D1, table: string): Promise<Set<string>> {
  const result = await db.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>()
  return new Set(result.results.map(row => row.name))
}

async function deleteByColumn(
  db: D1,
  table: string,
  column: string,
  value: string,
): Promise<DeletedRow> {
  const columns = await tableColumns(db, table)
  if (columns.size === 0) return { table, rows: 0, skipped: 'table-not-present' }
  if (!columns.has(column)) {
    throw new Error(`${table}.${column} is missing; refusing to report incomplete deletion as success`)
  }
  const result = await db.prepare(`DELETE FROM ${table} WHERE ${column} = ?`).bind(value).run()
  return { table, rows: result.meta.changes ?? 0 }
}

async function sha256Hex(value: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))
  return Array.from(digest).map(byte => byte.toString(16).padStart(2, '0')).join('')
}

async function deleteNextConversations(
  db: D1,
  internalSecret: string,
  userId: string,
): Promise<DeletedRow[]> {
  const conversationColumns = await tableColumns(db, 'ai_conversations')
  if (conversationColumns.size === 0) {
    return [
      { table: 'ai_messages', rows: 0, skipped: 'table-not-present' },
      { table: 'ai_conversations', rows: 0, skipped: 'table-not-present' },
    ]
  }
  for (const column of ['id', 'owner_type', 'owner_key']) {
    if (!conversationColumns.has(column)) throw new Error(`ai_conversations.${column} is missing`)
  }

  const ownerKey = await sha256Hex(`${internalSecret}:user:${userId}`)
  const messageColumns = await tableColumns(db, 'ai_messages')
  let messages: DeletedRow
  if (messageColumns.size === 0) {
    messages = { table: 'ai_messages', rows: 0, skipped: 'table-not-present' }
  } else {
    if (!messageColumns.has('conversation_id')) throw new Error('ai_messages.conversation_id is missing')
    const result = await db.prepare(`
      DELETE FROM ai_messages
      WHERE conversation_id IN (
        SELECT id FROM ai_conversations WHERE owner_type = 'client' AND owner_key = ?
      )
    `).bind(ownerKey).run()
    messages = { table: 'ai_messages', rows: result.meta.changes ?? 0 }
  }

  const conversationsResult = await db.prepare(
    "DELETE FROM ai_conversations WHERE owner_type = 'client' AND owner_key = ?",
  ).bind(ownerKey).run()
  return [messages, { table: 'ai_conversations', rows: conversationsResult.meta.changes ?? 0 }]
}

async function deleteFeedback(
  db: D1,
  userEmail: string | null,
): Promise<DeletedRow[]> {
  if (!userEmail) {
    return [
      { table: 'feedback_replies', rows: 0, skipped: 'no-account-email' },
      { table: 'feedback', rows: 0, skipped: 'no-account-email' },
    ]
  }

  const feedbackColumns = await tableColumns(db, 'feedback')
  if (feedbackColumns.size === 0) {
    return [
      { table: 'feedback_replies', rows: 0, skipped: 'table-not-present' },
      { table: 'feedback', rows: 0, skipped: 'table-not-present' },
    ]
  }
  if (!feedbackColumns.has('id') || !feedbackColumns.has('user_email')) {
    throw new Error('feedback ownership columns are missing')
  }

  const replyColumns = await tableColumns(db, 'feedback_replies')
  let replies: DeletedRow
  if (replyColumns.size === 0) {
    replies = { table: 'feedback_replies', rows: 0, skipped: 'table-not-present' }
  } else {
    if (!replyColumns.has('feedback_id')) throw new Error('feedback_replies.feedback_id is missing')
    const result = await db.prepare(`
      DELETE FROM feedback_replies
      WHERE feedback_id IN (SELECT id FROM feedback WHERE lower(user_email) = lower(?))
    `).bind(userEmail).run()
    replies = { table: 'feedback_replies', rows: result.meta.changes ?? 0 }
  }

  const feedbackResult = await db.prepare(
    'DELETE FROM feedback WHERE lower(user_email) = lower(?)',
  ).bind(userEmail).run()
  return [replies, { table: 'feedback', rows: feedbackResult.meta.changes ?? 0 }]
}

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  const recordEnv = env as Record<string, unknown>

  const internalSecret = recordEnv.INTERNAL_SECRET as string | undefined
  if (!internalSecret) {
    console.error('[internal/delete-user] INTERNAL_SECRET not configured')
    return errorJson('Internal server error', 500)
  }

  const providedSecret =
    req.headers.get('X-Internal-Secret') ??
    req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')

  if (!providedSecret || providedSecret !== internalSecret) {
    return errorJson('Unauthorized', 401)
  }

  let body: Record<string, unknown>
  try {
    body = await req.json() as Record<string, unknown>
  } catch {
    return errorJson('Invalid JSON body', 400)
  }

  const userId = typeof body.user_id === 'string' ? body.user_id.trim() : ''
  const userEmail = typeof body.user_email === 'string' && body.user_email.trim()
    ? body.user_email.trim().toLowerCase()
    : null
  if (!userId) return errorJson('user_id is required', 400)

  const db = getDB(recordEnv)
  const deleted: DeletedRow[] = []

  try {
    // Children/reference-style datasets first. Every operation is idempotent;
    // a retry after a partial D1 failure safely continues from the remainder.
    deleted.push(...await deleteFeedback(db, userEmail))
    deleted.push(...await deleteNextConversations(db, internalSecret, userId))
    for (const table of USER_ID_TABLES) {
      deleted.push(await deleteByColumn(db, table, 'user_id', userId))
    }
  } catch (error) {
    console.error('[internal/delete-user] Incomplete deletion:', (error as Error)?.message)
    return errorJson('User data deletion is incomplete. Retry required.', 503)
  }

  console.log(`[internal/delete-user] Completed product-data deletion for user ${userId}`)
  return secureJson({ ok: true, user_id: userId, deleted })
}
