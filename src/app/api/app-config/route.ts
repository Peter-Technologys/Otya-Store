import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

const KEY = 'app:remote-config'
const CURRENT_REVISION = 5

const DEFAULT_CONFIG = {
  schemaVersion: 1,
  revision: CURRENT_REVISION,
  maintenance: {
    enabled: false,
    title: 'OTYA online services are temporarily unavailable',
    message: 'Local playback and offline tools are still available.',
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
    transfer: true,
    private: true,
    // Legacy aliases are retained for older clients only.
    beam: true,
    safe: true,
    equalizer: true,
    whatsappTrimmer: true,
    converter: true,
    onlineThemes: true,
    googleSignIn: true,
    firebaseAuth: true,
    driveBackup: true,
    feedback: true,
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
    ai: 'https://petersmartlink.com/apps/otya-player/support',
  },
  ai: {
    enabled: true,
    standaloneService: false,
    optionalForPlayer: true,
    scope: 'otya-product-help',
    greeting: 'Ask about OTYA, playback, files, transfer, account or troubleshooting.',
    suggestedPrompts: [
      'How do I organize my music library in OTYA?',
      'Why will a video not play in OTYA?',
      'How does OTYA Transfer work?',
      'How do I protect files with Private?',
    ],
  },
  push: {
    enabled: true,
    provider: 'fcm',
    optionalForPlayback: true,
  },
  auth: {
    authority: 'otya-auth',
    emailPassword: 'cloudflare',
    otp: 'cloudflare-resend',
    firebaseIdentity: true,
    firebaseIsSessionAuthority: false,
  },
  search: {
    suggestions: [],
    categories: ['video', 'music', 'folders', 'playlists', 'files', 'help'],
    providerPriority: ['local', 'help'],
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

  const oldFeatures = asRecord(source.features)
  const features = {
    ...DEFAULT_CONFIG.features,
    transfer: oldFeatures.transfer ?? oldFeatures.beam ?? true,
    private: oldFeatures.private ?? oldFeatures.safe ?? true,
    beam: oldFeatures.transfer ?? oldFeatures.beam ?? true,
    safe: oldFeatures.private ?? oldFeatures.safe ?? true,
    equalizer: oldFeatures.equalizer ?? true,
    whatsappTrimmer: oldFeatures.whatsappTrimmer ?? oldFeatures.trimmer ?? true,
    converter: oldFeatures.converter ?? true,
    onlineThemes: oldFeatures.onlineThemes ?? true,
    googleSignIn: oldFeatures.googleSignIn ?? true,
    firebaseAuth: oldFeatures.firebaseAuth ?? true,
    driveBackup: oldFeatures.driveBackup ?? true,
    feedback: oldFeatures.feedback ?? true,
    aiAssistant: oldFeatures.aiAssistant ?? true,
    cloudPush: oldFeatures.cloudPush ?? true,
  }

  const links = { ...DEFAULT_CONFIG.links, ...asRecord(source.links), ai: DEFAULT_CONFIG.links.ai }
  const push = { ...DEFAULT_CONFIG.push, ...asRecord(source.push), provider: 'fcm', optionalForPlayback: true }

  return {
    ...DEFAULT_CONFIG,
    ...source,
    revision: CURRENT_REVISION,
    maintenance: { ...DEFAULT_CONFIG.maintenance, ...asRecord(source.maintenance), allowOfflinePlayback: true },
    versions: { ...DEFAULT_CONFIG.versions, ...asRecord(source.versions) },
    features,
    home: { ...DEFAULT_CONFIG.home, ...asRecord(source.home) },
    links,
    ai: DEFAULT_CONFIG.ai,
    push,
    auth: DEFAULT_CONFIG.auth,
    search: { ...DEFAULT_CONFIG.search, ...asRecord(source.search), providerPriority: ['local', 'help'] },
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
          // Best effort only. Remote config must never block OTYA startup.
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
