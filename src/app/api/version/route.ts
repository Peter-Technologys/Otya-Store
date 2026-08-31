import { NextResponse } from 'next/server'
import { GET as getLatest } from '../../latest/route'

// Backward-compatible public alias for older Android builds.
// Keep `/latest` as the single implementation/source of release metadata, but
// invoke it through a local handler rather than re-exporting the route symbol.
// OpenNext/Next route compilation can treat a cross-route re-export differently
// from a normal handler at runtime, which previously left `/api/version`
// returning HTTP 500 while `/latest` remained healthy.
export async function GET(request: Request) {
  return getLatest(request as never)
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, If-None-Match',
    },
  })
}
