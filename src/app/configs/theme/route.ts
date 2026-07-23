import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

// GET /configs/theme
// Called by OtyaService.fetchOtaTheme() in the Flutter app.
//
// Priority chain:
//   1. KV cache (key: "config:theme") — set via PUT or wrangler
//   2. R2 bucket (key: "configs/theme.json") — fallback storage
//   3. DEFAULT_THEME_V2 — hardcoded safe default
//
// Seasonal overrides are applied on top of whichever source wins:
//   • Christmas  : Dec 15 – Jan 5
//   • Halloween  : Oct 25 – Nov 2
//
// Supports ETag-based 304 Not Modified to save bandwidth.
//
// PUT /configs/theme — Admin-only: update theme in KV
//   Header: Authorization: Bearer YOUR_ADMIN_TOKEN
//   Body:   full v2 theme JSON
//
// V2 schema (all fields optional — app has safe defaults):
// {
//   "version": 2,
//   "theme_identity": "Otya_Default_Dark",
//   "is_dark_mode": true,
//   "google_font_family": "Montserrat",
//   "font_scale_ratio": 1.0,
//   "card_border_radius": 16.0,
//   "button_padding": 14.0,
//   "colors": {
//     "primary":             "#E50914",
//     "secondary":           "#B81D24",
//     "scaffold_background": "#141414",
//     "surface":             "#1F1F1F",
//     "accent":              "#FFD700",
//     "error":               "#D32F2F",
//     "text_primary":        "#FFFFFF",
//     "text_secondary":      "#B3B3B3"
//   },
//   "component_overrides": {
//     "app_bar_background": "#000000",
//     "card_background":    "#1F1F1F",
//     "nav_bar_selected":   "#E50914",
//     "button_text":        "#FFFFFF"
//   },
//   "announcement": {
//     "id":          "otya_v2_launch",
//     "show_dialog": false,
//     "title":       "🎉 Welcome!",
//     "message":     "Enjoy the new theme.",
//     "button_text": "Got It"
//   }
// }

const KV_KEY  = 'config:theme'
const R2_KEY  = 'configs/theme.json'

// ── Default v2 theme — Otya Default Dark (Netflix-inspired) ──────────────────
const DEFAULT_THEME_V2: ThemeV2 = {
  version:            2,
  theme_identity:     'Otya_Default_Dark',
  is_dark_mode:       true,
  google_font_family: 'Montserrat',
  font_scale_ratio:   1.0,
  card_border_radius: 16.0,
  button_padding:     14.0,
  colors: {
    primary:             '#E50914',
    secondary:           '#B81D24',
    scaffold_background: '#141414',
    surface:             '#1F1F1F',
    accent:              '#FFD700',
    error:               '#D32F2F',
    text_primary:        '#FFFFFF',
    text_secondary:      '#B3B3B3',
  },
  component_overrides: {
    app_bar_background: '#000000',
    card_background:    '#1F1F1F',
    nav_bar_selected:   '#E50914',
    button_text:        '#FFFFFF',
  },
  announcement: {
    id:          'otya_v2_launch',
    show_dialog: false,
    title:       '🎉 Welcome to Otya Player v2!',
    message:     'Enjoy enhanced playback stability and dynamic themes.',
    button_text: 'Got It',
  },
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface ThemeColors {
  primary?:             string
  secondary?:           string
  scaffold_background?: string
  surface?:             string
  accent?:              string
  error?:               string
  text_primary?:        string
  text_secondary?:      string
  [key: string]:        string | undefined
}

interface ThemeV2 {
  version?:            number
  theme_identity?:     string
  is_dark_mode?:       boolean
  google_font_family?: string
  font_scale_ratio?:   number
  card_border_radius?: number
  button_padding?:     number
  colors?:             ThemeColors
  component_overrides?: Record<string, string>
  announcement?: {
    id?:          string
    show_dialog?: boolean
    title?:       string
    message?:     string
    button_text?: string
  }
  [key: string]: unknown
}

// ── Seasonal Override ─────────────────────────────────────────────────────────
// Applied on top of whatever theme is loaded from KV / R2 / default.
// Mutates a deep clone so the original cached object is never modified.
function applySeasonalTheme(theme: ThemeV2): ThemeV2 {
  // Deep clone so we never mutate the cached object
  const t: ThemeV2 = JSON.parse(JSON.stringify(theme))
  if (!t.colors) t.colors = {}

  const now   = new Date()
  const month = now.getUTCMonth() + 1 // 1–12
  const day   = now.getUTCDate()

  // Christmas: Dec 15 – Jan 5
  const isChristmas =
    (month === 12 && day >= 15) ||
    (month === 1  && day <= 5)

  // Halloween: Oct 25 – Nov 2
  const isHalloween =
    (month === 10 && day >= 25) ||
    (month === 11 && day <= 2)

  if (isChristmas) {
    t.theme_identity              = 'Otya_Christmas_Special'
    t.colors.primary              = '#C62828' // Deep Red
    t.colors.secondary            = '#2E7D32' // Pine Green
    t.colors.accent               = '#FFD700' // Gold
    t.colors.scaffold_background  = '#0D1F12'
    t.colors.surface              = '#1B3B22'
    // Christmas announcement
    t.announcement = {
      id:          'otya_christmas',
      show_dialog: true,
      title:       '🎄 Merry Christmas from OTYA!',
      message:     'Wishing you joy and great music this festive season.',
      button_text: 'Thanks ❤️',
    }
  } else if (isHalloween) {
    t.theme_identity              = 'Otya_Halloween_Special'
    t.colors.primary              = '#FF6D00' // Pumpkin Orange
    t.colors.accent               = '#7C4DFF' // Deep Purple
    t.colors.scaffold_background  = '#120D1F'
    t.colors.surface              = '#221B3B'
    // Halloween announcement
    t.announcement = {
      id:          'otya_halloween',
      show_dialog: true,
      title:       '🎃 Happy Halloween from OTYA!',
      message:     'Spooky vibes, great music. Enjoy the season!',
      button_text: 'Boo! 👻',
    }
  }

  return t
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function safeParseJson(raw: string): ThemeV2 | null {
  try {
    return JSON.parse(raw) as ThemeV2
  } catch {
    return null
  }
}

function generateEtag(body: string): string {
  return `"${body.length}-${body.slice(0, 32).replace(/\s/g, '')}"`
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { env } = await getCloudflareContext()
    const kv = (env as Record<string, unknown>).KV as KVNamespace
    const r2 = (env as Record<string, unknown>).R2 as R2Bucket | undefined

    let themeData: ThemeV2 | null = null
    let sourceEtag: string | null = null

    // ── 1. Try KV first (fastest, cached) ────────────────────────────────────
    try {
      const { value, metadata } = await kv.getWithMetadata<{ etag: string }>(KV_KEY)
      if (value) {
        themeData  = safeParseJson(value)
        sourceEtag = (metadata as Record<string, string> | null)?.etag ?? null
      }
    } catch (e) {
      console.warn('[configs/theme] KV read failed:', e)
    }

    // ── 2. Fallback: R2 bucket (configs/theme.json) ───────────────────────────
    if (!themeData && r2) {
      try {
        const obj = await r2.get(R2_KEY)
        if (obj) {
          const raw  = await obj.text()
          themeData  = safeParseJson(raw)
          // R2 provides its own ETag via httpEtag
          sourceEtag = (obj as unknown as { httpEtag?: string }).httpEtag ?? null

          // Warm KV cache so next request is faster
          if (themeData) {
            const etag = sourceEtag ?? generateEtag(raw)
            kv.put(KV_KEY, raw, {
              expirationTtl: 3600,
              metadata: { etag },
            }).catch(() => { /* non-fatal */ })
          }
        }
      } catch (e) {
        console.warn('[configs/theme] R2 read failed:', e)
      }
    }

    // ── 3. Hardcoded default ──────────────────────────────────────────────────
    if (!themeData) {
      themeData = DEFAULT_THEME_V2
    }

    // ── Apply seasonal overrides ──────────────────────────────────────────────
    const finalTheme = applySeasonalTheme(themeData)
    const body       = JSON.stringify(finalTheme)
    const etag       = sourceEtag ?? generateEtag(body)

    // ── ETag 304 check ────────────────────────────────────────────────────────
    // Note: seasonal themes change the body even if the base theme hasn't
    // changed, so we append the current date (YYYYMMDD) to the ETag so
    // clients always get the seasonal version on the day it activates.
    const now         = new Date()
    const dateStamp   = `${now.getUTCFullYear()}${now.getUTCMonth()}${now.getUTCDate()}`
    const seasonalEtag = `${etag}-${dateStamp}`

    const clientEtag = req.headers.get('if-none-match')
    if (clientEtag && clientEtag === seasonalEtag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag:                          seasonalEtag,
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type':                'application/json',
        ETag:                          seasonalEtag,
        'Cache-Control':               'public, max-age=300, stale-while-revalidate=60',
        'Access-Control-Allow-Origin': '*',
        'Vary':                        'Accept-Encoding',
      },
    })
  } catch (err) {
    console.error('[configs/theme GET]', err)
    // Always return a valid theme — never a 500 to the Flutter app
    return new NextResponse(JSON.stringify(applySeasonalTheme(DEFAULT_THEME_V2)), {
      status: 200,
      headers: {
        'Content-Type':                'application/json',
        'Cache-Control':               'public, max-age=60',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}

// ── PUT ───────────────────────────────────────────────────────────────────────
// Admin-only: update the theme stored in KV.
// Header: Authorization: Bearer YOUR_ADMIN_TOKEN
// Body:   full v2 theme JSON
export async function PUT(req: NextRequest) {
  try {
    const { env }    = await getCloudflareContext()
    const adminToken = (env as Record<string, unknown>).ADMIN_TOKEN as string | undefined

    const auth = req.headers.get('authorization') ?? ''
    if (!adminToken || auth !== `Bearer ${adminToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body   = await req.text()
    const parsed = safeParseJson(body)

    if (!parsed) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    if (!parsed.colors && !parsed.accent && !parsed.label) {
      return NextResponse.json(
        { error: 'Invalid theme: must have a colors, accent, or label field' },
        { status: 400 }
      )
    }

    const kv   = (env as Record<string, unknown>).KV as KVNamespace
    const etag = `"${Date.now()}"`

    await kv.put(KV_KEY, body, {
      expirationTtl: 86400 * 30, // 30 days
      metadata: { etag },
    })

    return NextResponse.json({
      ok:      true,
      etag,
      message: 'Theme updated. App picks it up within 5 minutes (or immediately on next cold start).',
    })
  } catch (err) {
    console.error('[configs/theme PUT]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
