import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const dynamic = 'force-dynamic'

interface VerifyResponse {
  success?: boolean
  'error-codes'?: string[]
}

export async function POST(req: NextRequest) {
  let token = ''
  let abi: 'arm64' | 'arm32' = 'arm64'

  try {
    const body = await req.json() as { token?: string; abi?: string }
    token = body.token?.trim() ?? ''
    if (body.abi === 'arm32') abi = 'arm32'
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  if (!token) return NextResponse.json({ error: 'Verification required.' }, { status: 400 })

  try {
    const { env } = await getCloudflareContext()
    const secret = (env as Record<string, unknown>).TURNSTILE_SECRET_KEY
    if (typeof secret !== 'string' || !secret) {
      return NextResponse.json({ error: 'Download verification is not configured.' }, { status: 503 })
    }

    const form = new FormData()
    form.set('secret', secret)
    form.set('response', token)
    const ip = req.headers.get('CF-Connecting-IP')
    if (ip) form.set('remoteip', ip)

    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    })
    const result = await verify.json() as VerifyResponse

    if (!verify.ok || !result.success) {
      return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 403 })
    }

    return NextResponse.json({
      ok: true,
      url: `/apk/${abi}`,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    return NextResponse.json({ error: 'Verification service unavailable.' }, { status: 503 })
  }
}
