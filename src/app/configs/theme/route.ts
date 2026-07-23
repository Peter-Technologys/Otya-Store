import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

// GET /configs/theme
// Called by OtyaService.fetchOtaTheme() in the Flutter app.
// Supports ETag-based 304 Not Modified to save bandwidth.
//
// Theme JSON is stored in KV under key "config:theme".
// To update the theme:
//   wrangler kv key put --namespace-id=3f179286e0fc4dbfa2332884cdf81312 "config:theme" '{"label":"Midnight Cyan",...}'
//
// Expected JSON shape (all fields optional — app has safe defaults):
// {
//   "label":           "Midnight Cyan",
//   "accent":          "#00E5FF",
//   "accentSecondary": "#8B5CF6",
//   "background":      "#0F1117",
//   "surface":         "#161B27",
//   "textPrimary":     "#F0F6FF",
//   "textSecondary":   "#8BA3C7",
//   "cardRadius":      24.0,
//   "buttonRadius":    14.0
// }

const KV_KEY = 'config:theme'
const DEFAULT_THEME = JSON.stringify({
  label:           'Midnight Cyan',
  accent:          '#00E5FF',
  accentSecondary: '#8B5CF6',
  background:      '#0F1117',
  surface:         '#161B27',
  textPrimary:     '#F0F6FF',
  textSecondary:   '#8BA3C7',
  cardRadius:      24.0,
  buttonRadius:    14.0,
})

export async function GET(req: NextRequest) {
  try {
    const { env } = await getCloudflareContext()
    const kv = (env as Record<string, unknown>).KV as KVNamespace

    const { value: themeJson, metadata } =
      await kv.getWithMetadata<{ etag: string }>(KV_KEY)

    const body = themeJson ?? DEFAULT_THEME
    const etag = (metadata as Record<string, string> | null)?.etag ?? `"default"`

    // Honour If-None-Match — saves bandwidth on every app foreground
    const clientEtag = req.headers.get('if-none-match')
    if (clientEtag && clientEtag === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: etag, 'Access-Control-Allow-Origin': '*' },
      })
    }

    return new NextResponse(body, {
      headers: {
        'Content-Type':                'application/json',
        ETag:                          etag,
        'Cache-Control':               'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    console.error('[configs/theme]', err)
    return new NextResponse(DEFAULT_THEME, {
      headers: {
        'Content-Type':                'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}
