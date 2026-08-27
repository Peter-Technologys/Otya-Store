import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

const KEY = 'app:remote-config'

const DEFAULT_CONFIG = {
  schemaVersion: 1,
  revision: 2,
  maintenance: {
    enabled: false,
    title: 'OTYA is temporarily unavailable',
    message: 'Please try again shortly.',
    allowOfflinePlayback: true,
    services: {},
  },
  versions: {
    minimumBuild: 1,
    recommendedBuild: 1,
    forceUpdate: false,
    minimumMessage: 'This version of OTYA can no longer use online services. Please update to continue.',
    recommendedMessage: 'A newer OTYA version is available with improvements and fixes.',
    downloadUrl: 'https://petersmartlink.com/download/otya-player',
  },
  features: {
    beam: true,
    safe: true,
    equalizer: true,
    trimmer: true,
    converter: true,
    merger: true,
    compressor: true,
    recorder: true,
    audioTools: true,
    videoTools: true,
    onlineThemes: true,
    accountSync: true,
    cloudSync: true,
    googleSignIn: true,
    driveBackup: true,
    feedback: true,
    ratings: true,
    aiAssistant: false,
    cloudPush: false,
  },
  home: {
    featuredCard: {
      enabled: true,
      title: 'Your media. Your way.',
      subtitle: 'Private, fast and built for everyday playback.',
      action: '/myspace',
    },
    sectionOrder: ['continue', 'recent', 'featured', 'tools'],
    banners: [],
  },
  announcement: null,
  links: {
    website: 'https://petersmartlink.com/otya-player',
    download: 'https://petersmartlink.com/download/otya-player',
    support: 'https://petersmartlink.com/contact',
    privacy: 'https://petersmartlink.com/privacy',
    terms: 'https://petersmartlink.com/terms',
  },
  ai: {
    enabled: false,
    greeting: 'How can I help with your media?',
    suggestedPrompts: ['Find my recent videos', 'Help me organize my music'],
  },
  search: {
    suggestions: [],
    categories: ['video', 'music', 'folders', 'playlists'],
    providerPriority: ['local'],
    timeoutSeconds: 6,
  },
  experiments: {
    assignment: 'stable-per-install',
    saltVersion: 1,
    items: {},
  },
  regions: {
    default: { enabled: true },
    UG: { enabled: true },
  },
  runtime: {
    apiTimeoutSeconds: 8,
    retryCount: 2,
    retryBackoffMs: 500,
    catalogRefreshMinutes: 30,
    configRefreshMinutes: 15,
    updateCheckHours: 12,
  },
  campaigns: [],
}

export async function GET() {
  const { env } = await getCloudflareContext({ async: true })
  const kv = (env as Record<string, unknown>).KV as { get(key: string, type?: 'json'): Promise<unknown> } | undefined
  let config: unknown = DEFAULT_CONFIG

  if (kv) {
    try {
      const stored = await kv.get(KEY, 'json')
      if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
        config = stored
      }
    } catch {
      config = DEFAULT_CONFIG
    }
  }

  return NextResponse.json(
    { ok: true, config, fetchedAt: new Date().toISOString() },
    {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  )
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  })
}
