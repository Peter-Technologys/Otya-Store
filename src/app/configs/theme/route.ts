import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

// GET /configs/theme
// Called by OtyaService.fetchOtaTheme() in the Flutter app.
// Supports ETag-based 304 Not Modified to save bandwidth.
// Supports KV read-through cache (1 hour TTL) to avoid R2/KV reads on every request.
//
// Theme JSON is stored in KV under key "config:theme".
// To update the theme run:
//   wrangler kv key put --namespace-id=3f179286e0fc4dbfa2332884cdf81312 "config:theme" "$(cat theme.json)"
//
// V2 schema (all fields optional — app has safe defaults for every field):
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
//     "title":       "Welcome!",
//     "message":     "Enjoy the new theme.",
//     "button_text": "Got It"
//   }
// }

const KV_KEY = 'config:theme'

// Default v2 theme — Otya Default Dark (Netflix-inspired)
const DEFAULT_THEME_V2 = JSON.stringify({
  version: 2,
  theme_identity: 'Otya_Default_Dark',
  is_dark_mode: true,
  google_font_family: 'Montserrat',
  font_scale_ratio: 1.0,
  card_border_radius: 16.0,
  button_padding: 14.0,
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
})

export async function GET(req: NextRequest) {
  try {
    const { env } = await getCloudflareContext()
    const kv = (env as Record<string, unknown>).KV as KVNamespace

    // Read theme + stored ETag from KV metadata
    const { value: themeJson, metadata } =
      await kv.getWithMetadata<{ etag: string }>(KV_KEY)

    const body = themeJson ?? DEFAULT_THEME_V2
    const storedEtag = (metadata as Record<string, string> | null)?.etag

    // Generate a stable ETag from the body content if none stored
    const etag = storedEtag ?? `"${Buffer.from(body).length}-${body.length}"`

    // Honour If-None-Match — saves bandwidth on every app foreground
    const clientEtag = req.headers.get('if-none-match')
    if (clientEtag && clientEtag === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag:                          etag,
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // Validate the stored JSON is parseable before sending
    // If corrupted, fall back to default silently
    let validBody = body
    try {
      JSON.parse(body)
    } catch {
      console.warn('[configs/theme] KV value is not valid JSON — using default')
      validBody = DEFAULT_THEME_V2
    }

    return new NextResponse(validBody, {
      headers: {
        'Content-Type':                'application/json',
        ETag:                          etag,
        'Cache-Control':               'public, max-age=3600, stale-while-revalidate=300',
        'Access-Control-Allow-Origin': '*',
        'Vary':                        'Accept-Encoding',
      },
    })
  } catch (err) {
    console.error('[configs/theme]', err)
    // Always return a valid theme — never a 500 to the app
    return new NextResponse(DEFAULT_THEME_V2, {
      headers: {
        'Content-Type':                'application/json',
        'Cache-Control':               'public, max-age=60',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}

// PUT /configs/theme — Admin-only: update the theme in KV
// Header: Authorization: Bearer YOUR_ADMIN_TOKEN
// Body: the full theme JSON
export async function PUT(req: NextRequest) {
  try {
    const { env } = await getCloudflareContext()
    const adminToken = (env as Record<string, unknown>).ADMIN_TOKEN as string | undefined

    const auth = req.headers.get('authorization') ?? ''
    if (!adminToken || auth !== `Bearer ${adminToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.text()

    // Validate JSON
    try {
      const parsed = JSON.parse(body) as Record<string, unknown>
      if (!parsed.colors && !parsed.accent && !parsed.label) {
        return NextResponse.json(
          { error: 'Invalid theme: must have colors or accent field' },
          { status: 400 }
        )
      }
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const kv   = (env as Record<string, unknown>).KV as KVNamespace
    const etag = `"${Date.now()}"`

    // Store with ETag in metadata and 24h TTL
    await kv.put(KV_KEY, body, {
      expirationTtl: 86400 * 30, // 30 days
      metadata: { etag },
    })

    return NextResponse.json({
      ok:      true,
      etag,
      message: 'Theme updated. App will pick it up within 1 hour (or immediately on next cold start).',
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
