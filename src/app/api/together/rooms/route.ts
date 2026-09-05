import { getCloudflareContext } from '@opennextjs/cloudflare'
import type { NextRequest } from 'next/server'
import { createTogetherRoom, togetherOptions } from '@/lib/together-control'

export async function POST(request: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  return createTogetherRoom(request, env as Record<string, unknown>)
}

export async function OPTIONS() {
  return togetherOptions()
}
