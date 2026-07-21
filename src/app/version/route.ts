import { NextRequest, NextResponse } from 'next/server'

// GET /version — alias for /latest
export async function GET(req: NextRequest) {
  const url = new URL('/latest', req.url)
  const res = await fetch(url.toString())
  const data = await res.text()
  return new NextResponse(data, {
    status: res.status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
