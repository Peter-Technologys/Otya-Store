import { NextResponse } from 'next/server'

// Backward-compatible public alias for older Android builds.
// `/latest` is the single implementation and source of release metadata.
export { GET } from '../../latest/route'

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
