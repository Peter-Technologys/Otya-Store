import { NextRequest, NextResponse } from 'next/server'

/**
 * Shared token auth for all Flutter-facing API routes.
 *
 * The Flutter app sends `X-App-Token: <token>` on every request.
 * The token is stored as a Cloudflare Worker secret (APP_TOKEN).
 *
 * Setup:
 *   1. Generate: openssl rand -hex 32
 *   2. Store:    wrangler secret put APP_TOKEN
 *   3. Add the same value to lib/core/config/environment.dart:
 *        static const String appToken = 'YOUR_TOKEN_HERE';
 *   4. Flutter sends it as: headers: { 'X-App-Token': Environment.appToken }
 *
 * Returns null if authorised, or a 401 NextResponse.
 */
export function requireAppToken(
  req: NextRequest,
  env: Record<string, unknown>,
): NextResponse | null {
  const expected = env.APP_TOKEN as string | undefined
  if (!expected) {
    // Not configured yet — allow all (dev / first deploy). Log a warning.
    console.warn('[auth] APP_TOKEN not set. Set it with: wrangler secret put APP_TOKEN')
    return null
  }
  const provided = req.headers.get('x-app-token') ?? ''
  if (provided !== expected) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: { 'Access-Control-Allow-Origin': 'https://petersmartlink.com' } },
    )
  }
  return null
}

/**
 * CORS headers for Flutter-facing API routes.
 * Restricts Allow-Origin to the canonical domain.
 */
export const API_CORS = {
  'Access-Control-Allow-Origin':  'https://petersmartlink.com',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-App-Token',
} as const
