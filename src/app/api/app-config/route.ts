import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

const KEY = 'app:remote-config'
const CURRENT_REVISION = 4

const DEFAULT_CONFIG = {
  schemaVersion: 1,
  revision: CURRENT_REVISION,
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
    whatsappTrimmer: true,
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
    aiAssistant: true,
    cloudPush: true,
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
    support: 'https://petersmartlink.com/apps/otya-player/support',
    privacy: 'https://petersmartlink.com/privacy',
    terms: 'https://petersmartlink.com/terms',
    docs: 'https://petersmartlink.com/docs',
    account: 'https://petersmartlink.com/account',
    ai: 'https://petersmartlink.com/ai',
  },
  ai: {
    enabled: true,
    standaloneService: true,
    optionalForPlayer: true,
    greeting: 'What can I help with?',
    suggestedPrompts: [
      'Help me organize my music library',
      'Explain something I am learning',
      'Help me write a professional message',
      'How can I fix a video that will not play?',
    ],
  },
  push: {
    enabled: true,
    provider: 'fcm',
    optionalForPlayback: true,
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

type ConfigRecord = Record<string, unknown>

function asRecord(value: unknown): ConfigRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as ConfigRecord
    : {}
}

function migrateConfig(stored: unknown): ConfigRecord {
  const source = asRecord(stored)
  const revision = Number(source.revision ?? 0)
  if (revision >= CURRENT_REVISION) return source

  const features = { ...DEFAULT_CONFIG.features, ...asRecord(source.features) }
  const links = { ...DEFAULT_CONFIG.links, ...asRecord(source.links) }
  const ai = { ...DEFAULT_CONFIG.ai, ...asRecord(source.ai) }
  const push = { ...DEFAULT_CONFIG.push, ...asRecord(source.push) }

  // Before revision 4 these two flags were stale defaults rather than an
  // intentional service switch. Normalize them once during migration. Once a
  // stored config is revision 4+, explicit admin true/false choices are kept.
  features.aiAssistant = true
  features.cloudPush = true
  ai.enabled = true
  ai.standaloneService = true
  ai.optionalForPlayer = true
  push.enabled = true
  push.provider = 'fcm'
  push.optionalForPlayback = true

  return {
    ...DEFAULT_CONFIG,
    ...source,
    revision: CURRENT_REVISION,
    maintenance: { ...DEFAULT_CONFIG.maintenance, ...asRecord(source.maintenance) },
    versions: { ...DEFAULT_CONFIG.versions, ...asRecord(source.versions) },
    features,
    home: { ...DEFAULT_CONFIG.home, ...asRecord(source.home) },
    links,
    ai,
    push,
    search: { ...DEFAULT_CONFIG.search, ...asRecord(source.search) },
    experiments: { ...DEFAULT_CONFIG.experiments, ...asRecord(source.experiments) },
    regions: { ...DEFAULT_CONFIG.regions, ...asRecord(source.regions) },
    runtime: { ...DEFAULT_CONFIG.runtime, ...asRecord(source.runtime) },
  }
}

export async function GET() {
  const { env } = await getCloudflareContext({ async: true })
  const kv = (env as Record<string, unknown>).KV as {
    get(key: string, type?: 'json'): Promise<unknown>
    put?(key: string, value: string): Promise<void>
  } | undefined
  let config: ConfigRecord = DEFAULT_CONFIG

  if (kv) {
    try {
      const stored = await kv.get(KEY, 'json')
      if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
        const migrated = migrateConfig(stored)
        config = migrated
        const oldRevision = Number(asRecord(stored).revision ?? 0)
        if (oldRevision < CURRENT_REVISION && kv.put) {
          // Best-effort persistence. A KV write failure must never block app
          // startup; the migrated response is still returned for this request.
          kv.put(KEY, JSON.stringify(migrated)).catch(() => {})
        }
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
