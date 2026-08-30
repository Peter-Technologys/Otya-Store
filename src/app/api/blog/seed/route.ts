import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifyAdminSession } from '@/lib/admin_auth'

const POSTS = [
  {
    id: 'post-001',
    title: 'Meet OTYA Player — The Free Music & Video App That Works Without Internet',
    excerpt: 'Play all your music and videos for free, no internet needed. No account required.',
    category: 'Announcement',
    authorName: 'Otya',
    createdAt: '2026-07-01T08:00:00.000Z',
    isPublished: 1,
    content: `Have you ever wanted to play your music and videos without using your data? That is exactly what OTYA Player does.

You do not need an account, you do not need Wi-Fi — just install it and play. It supports common audio and video formats and is designed to keep local playback available offline.

Whether you are on a bus, at home, or anywhere without internet, your local music and videos keep playing.

Download it from petersmartlink.com while Otya's dedicated domain migration is being prepared.`,
  },
  {
    id: 'post-002',
    title: 'OTYA Player v1.4.0 Is Here — Faster, Safer, and Better Than Ever',
    excerpt: 'Version 1.4.0 brings security fixes, smoother playback, and better support for more Android phones.',
    category: 'Update',
    authorName: 'Otya',
    createdAt: '2026-07-23T10:00:00.000Z',
    isPublished: 1,
    content: `We released an OTYA Player update with security, playback, storage and compatibility improvements.

Update your app from petersmartlink.com/download/otya-player while the dedicated Otya domain migration is being prepared.`,
  },
  {
    id: 'post-003',
    title: 'How to Share Files Between Phones Without Internet Using OTYA Player',
    excerpt: 'Send supported local media to another phone without relying on mobile data.',
    category: 'Tips',
    authorName: 'Otya',
    createdAt: '2026-07-10T08:00:00.000Z',
    isPublished: 1,
    content: `OTYA Player includes supported local transfer features for sharing media between nearby devices without depending on a cloud upload.

Open the transfer feature, choose the supported file, connect to the nearby device and approve the transfer on the receiving side.`,
  },
  {
    id: 'post-004',
    title: 'Keep Your Private Videos Protected with OTYA Player Vault',
    excerpt: 'Protect supported private media behind the app vault controls.',
    category: 'Tips',
    authorName: 'Otya',
    createdAt: '2026-07-15T08:00:00.000Z',
    isPublished: 1,
    content: `OTYA Player includes a Vault for supported private media. Use the app's available device authentication controls to protect access and keep supported Vault media separate from the normal browsing experience.`,
  },
  {
    id: 'post-005',
    title: 'Otya — Built in Uganda for Everyday Media',
    excerpt: 'Otya is built with offline-first media use in mind.',
    category: 'Story',
    authorName: 'Otya',
    createdAt: '2026-07-05T08:00:00.000Z',
    isPublished: 1,
    content: `Otya is built in Uganda with an offline-first approach to local music and video playback.

The goal is simple: core local playback should keep working even when internet access is limited or unavailable.`,
  },
]

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  const recordEnv = env as Record<string, unknown>
  if (!await verifyAdminSession(req, recordEnv)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }

  const db = recordEnv.DB as import('@/lib/d1').D1

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      excerpt     TEXT,
      content     TEXT NOT NULL,
      category    TEXT,
      authorName  TEXT,
      createdAt   TEXT NOT NULL,
      isPublished INTEGER NOT NULL DEFAULT 0
    )
  `).run()

  let inserted = 0
  for (const post of POSTS) {
    const result = await db.prepare(`
      INSERT OR IGNORE INTO blog_posts
        (id, title, excerpt, content, category, authorName, createdAt, isPublished)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      post.id, post.title, post.excerpt, post.content,
      post.category, post.authorName, post.createdAt, post.isPublished,
    ).run()
    if ((result.meta.changes ?? 0) > 0) inserted++
  }

  return new Response(JSON.stringify({ ok: true, inserted, total: POSTS.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
