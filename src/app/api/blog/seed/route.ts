import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

// POST /api/blog/seed
// Admin-only: seeds the blog_posts table with initial posts.
// Header: Authorization: Bearer YOUR_ADMIN_TOKEN
// Safe to run multiple times — uses INSERT OR IGNORE.

const POSTS = [
  {
    id: 'post-001',
    title: 'Meet OTYA Player — The Free Music & Video App That Works Without Internet',
    excerpt: 'Play all your music and videos for free, no internet needed. No account required.',
    category: 'Announcement',
    authorName: 'PeterSmart Technologies',
    createdAt: '2026-07-01T08:00:00.000Z',
    isPublished: 1,
    content: `Have you ever wanted to play your music and videos without using your data? That is exactly what OTYA Player does.

It is a free Android app made by PeterSmart Technologies, right here in Uganda. You do not need an account, you do not need Wi-Fi — just install it and play. It supports all file types: MP3, MP4, MKV, AVI, and more.

Whether you are on a bus, in a village, or anywhere without internet, your music and videos keep playing.

Download it today from our website at petersmartlink.com.`,
  },
  {
    id: 'post-002',
    title: 'OTYA Player v1.4.0 Is Here — Faster, Safer, and Better Than Ever',
    excerpt: 'Version 1.4.0 brings security fixes, smoother playback, and better support for more Android phones.',
    category: 'Update',
    authorName: 'PeterSmart Technologies',
    createdAt: '2026-07-23T10:00:00.000Z',
    isPublished: 1,
    content: `We just released a big update to OTYA Player. Here is what changed:

🔒 AirDrop is now safer
When you share files over Wi-Fi, only the right person can receive them. No strangers on the same network can steal your files.

⚡ Smoother playback
The music player no longer drains your battery as fast. We fixed a bug that was doing too much work in the background.

🛠️ Storage Cleaner now works
You can now clear saved positions to free up space on your phone.

✅ Settings now save properly
Your preferences like dark mode or audio speed now stay saved even after you close the app.

📱 Works on more phones
We fixed issues that were causing crashes on some Android devices.

Update your app now from petersmartlink.com/download/otya-player.`,
  },
  {
    id: 'post-003',
    title: 'How to Share Files Between Phones Without Internet Using OTYA Player',
    excerpt: 'Send music and videos to another phone for free — no data, no cables, no cost.',
    category: 'Tips',
    authorName: 'PeterSmart Technologies',
    createdAt: '2026-07-10T08:00:00.000Z',
    isPublished: 1,
    content: `Did you know OTYA Player lets you send music and videos to another phone without using mobile data or Wi-Fi from a router?

It uses a feature called AirDrop, which works through Wi-Fi Direct and Bluetooth. Here is how it works:

1. Open OTYA Player on your phone.
2. Go to the AirDrop section.
3. Select the file you want to share.
4. The other person opens AirDrop on their phone and accepts.
5. The file arrives directly — no internet, no cost.

This is perfect for sharing music with friends nearby, especially when data is expensive or unavailable.`,
  },
  {
    id: 'post-004',
    title: 'Keep Your Private Videos Hidden with OTYA Player Vault',
    excerpt: 'Lock your private photos and videos behind a fingerprint or PIN — hidden from your gallery.',
    category: 'Tips',
    authorName: 'PeterSmart Technologies',
    createdAt: '2026-07-15T08:00:00.000Z',
    isPublished: 1,
    content: `Some videos and photos are just for you. OTYA Player has a Vault — a private, locked folder on your phone.

You unlock it with your fingerprint or a PIN. Files inside the Vault do not show up in your phone gallery, so nobody else can see them.

It is built right into the app. No extra app needed, no extra cost.

To use it:
1. Open OTYA Player.
2. Go to the Vault tab.
3. Set up your fingerprint or PIN.
4. Move any file into the Vault.

Your private files stay private.`,
  },
  {
    id: 'post-005',
    title: 'A Media App Built in Uganda, for Everyone',
    excerpt: 'OTYA Player is proudly built in Uganda by PeterSmart Technologies — 100% offline, free, and for everyone.',
    category: 'Story',
    authorName: 'PeterSmart Technologies',
    createdAt: '2026-07-05T08:00:00.000Z',
    isPublished: 1,
    content: `OTYA Player is built by PeterSmart Technologies, a tech team based in Uganda.

We built it because we know what it is like to have limited internet but still want to enjoy music and videos. That is why the app works 100% offline, is lightweight, and is completely free.

We are proud to build technology that works for our community — and for anyone around the world who wants a simple, powerful media player.

OTYA Player is available for Android. Download it at petersmartlink.com.`,
  },
]

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext()
  const adminToken = (env as Record<string, unknown>).ADMIN_TOKEN as string | undefined
  const auth = req.headers.get('authorization') ?? ''
  if (!adminToken || auth !== `Bearer ${adminToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = (env as Record<string, unknown>).DB as import('@/lib/d1').D1

  // Ensure table exists
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
    inserted++
  }

  return NextResponse.json({ ok: true, inserted, total: POSTS.length })
}
