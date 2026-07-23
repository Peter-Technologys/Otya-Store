import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

// POST /api/push — Admin-only: send FCM push notification
// Header: Authorization: Bearer YOUR_ADMIN_TOKEN
//
// Body:
// {
//   "title":    "New update!",
//   "body":     "OTYA Player v1.5.0 is available.",
//   "url":      "https://petersmartlink.com/download",  // optional
//   "deviceId": "abc123"                                // optional — omit to broadcast all
// }
export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext()
  const adminToken = (env as Record<string, unknown>).ADMIN_TOKEN as string | undefined
  const fcmKey     = (env as Record<string, unknown>).FCM_SERVER_KEY as string | undefined

  // Auth
  const auth = req.headers.get('authorization') ?? ''
  if (!adminToken || auth !== `Bearer ${adminToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!fcmKey) {
    return NextResponse.json({ error: 'FCM_SERVER_KEY not configured' }, { status: 503 })
  }

  const body = await req.json() as Record<string, string>
  const { title, body: msgBody, url, deviceId } = body
  if (!title || !msgBody) {
    return NextResponse.json({ error: 'title and body required' }, { status: 400 })
  }

  const db = (env as Record<string, unknown>).DB as D1Database

  // Fetch FCM tokens
  let tokens: string[] = []
  if (deviceId) {
    const row = await db.prepare(
      'SELECT fcm_token FROM devices WHERE device_id = ? AND fcm_token IS NOT NULL'
    ).bind(deviceId).first<{ fcm_token: string }>()
    if (row?.fcm_token) tokens = [row.fcm_token]
  } else {
    const { results } = await db.prepare(
      'SELECT fcm_token FROM devices WHERE fcm_token IS NOT NULL LIMIT 500'
    ).all<{ fcm_token: string }>()
    tokens = results.map(r => r.fcm_token)
  }

  if (tokens.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: 'No registered devices' })
  }

  // Send via FCM legacy HTTP API (batches of 500)
  let sent = 0, failed = 0
  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500)
    const res = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `key=${fcmKey}`,
      },
      body: JSON.stringify({
        registration_ids: batch,
        notification: { title, body: msgBody },
        data: { url: url ?? 'https://petersmartlink.com/download' },
        android: { priority: 'high' },
      }),
    })
    const result = await res.json() as Record<string, number>
    sent   += result.success ?? 0
    failed += result.failure ?? 0
  }

  return NextResponse.json({ ok: true, sent, failed, total: tokens.length })
}
