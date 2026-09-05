import { getCloudflareContext } from '@opennextjs/cloudflare'
import type { NextRequest } from 'next/server'
import { joinTogetherRoom, togetherOptions } from '@/lib/together-control'

type Context = { params: Promise<{ roomId: string }> }

export async function POST(request: NextRequest, { params }: Context) {
  const { env } = await getCloudflareContext({ async: true })
  const { roomId } = await params
  return joinTogetherRoom(request, env as Record<string, unknown>, roomId)
}

export async function OPTIONS() {
  return togetherOptions()
}
