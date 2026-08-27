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
  {
    id: 'christmas-under-the-stars',
    name: 'Christmas Under the Stars',
    story: 'A peaceful Christmas night in the mountains — snowy ridges, warm village lights and a violet sky. Festive without turning OTYA into a red-and-green toy.',
    scene: 'winter_lights',
    version: 1,
    overlay: 0.34,
    featured: true,
    seasonal: {
      start: '12-15',
      end: '12-26',
      priority: 100,
      autoApply: true,
    },
    palette: {
      skyTop: '#0E1027',
      skyMid: '#35206B',
      horizon: '#8B5CF6',
      land: '#080A10',
      water: '#0C1020',
      accent: '#C4B5FD',
      warm: '#FDE68A',
    },
  },
  {
    id: 'midnight-2027',
    name: 'Midnight 2027',
    story: 'A new year begins over a quiet lake — violet fireworks above dark mountains, reflected light on the water and a clean midnight atmosphere for a fresh start.',
    scene: 'fireworks_lake',
    version: 1,
    overlay: 0.30,
    featured: true,
    seasonal: {
      start: '12-27',
      end: '01-07',
      priority: 110,
      autoApply: true,
    },
    palette: {
      skyTop: '#070818',
      skyMid: '#231153',
      horizon: '#6D28D9',
      land: '#050609',
      water: '#090B18',
      accent: '#A78BFA',
      warm: '#FDE68A',
    },
  },
] as const

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      catalogVersion: 2,
      themes: THEMES,
      updatedAt: '2026-08-27T08:30:00Z',
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
