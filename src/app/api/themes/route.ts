// app/api/themes/route.ts
// Public read-only catalog for installable OTYA visual themes.
// Themes are tiny manifests: Flutter renders them locally, so once installed
// they remain available offline and no binary wallpaper download is required.

import { NextResponse } from 'next/server'

const THEMES = [
  {
    id: 'rwenzori-echo',
    name: 'Rwenzori Echo',
    story: 'A quiet violet night above Uganda’s Mountains of the Moon — cold peaks, still water and a calm glow built for late-night listening.',
    scene: 'mountain_lake',
    version: 1,
    overlay: 0.38,
    featured: true,
    palette: {
      skyTop: '#150B2E',
      skyMid: '#4C1D95',
      horizon: '#A855F7',
      land: '#09070E',
      water: '#100B1D',
      accent: '#8B5CF6',
    },
  },
  {
    id: 'nile-afterglow',
    name: 'Nile Afterglow',
    story: 'The last light follows the Nile into evening — warm violet water, papyrus silhouettes and a softer horizon for relaxed listening and reading.',
    scene: 'river_sunset',
    version: 1,
    overlay: 0.34,
    featured: true,
    palette: {
      skyTop: '#1B1028',
      skyMid: '#6D28D9',
      horizon: '#F472B6',
      land: '#0A080D',
      water: '#241033',
      accent: '#A78BFA',
    },
  },
] as const

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      catalogVersion: 1,
      themes: THEMES,
      updatedAt: '2026-08-27T00:00:00Z',
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=1800, stale-while-revalidate=86400',
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
