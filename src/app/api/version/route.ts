import { NextRequest, NextResponse } from 'next/server'
import { GET as getLatest } from '../../latest/route'

// Backward-compatible public alias for older Android builds.
// `/latest` remains the single implementation/source of release metadata.
// Invoke the handler explicitly instead of re-exporting it across route modules;
// this avoids the OpenNext runtime failure that left `/api/version` returning 500
// while `/latest` remained healthy.
export async function GET(request: NextRequest) {
  return getLatest(request)
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
