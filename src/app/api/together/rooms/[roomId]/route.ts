import { getCloudflareContext } from '@opennextjs/cloudflare'
import type { NextRequest } from 'next/server'
import {
  closeTogetherRoom,
  getTogetherRoom,
  togetherOptions,
} from '@/lib/together-control'

type Context = { params: Promise<{ roomId: string }> }

export async function GET(request: NextRequest, { params }: Context) {
  const { env } = await getCloudflareContext({ async: true })
  const { roomId } = await params
  return getTogetherRoom(request, env as Record<string, unknown>, roomId)
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const { env } = await getCloudflareContext({ async: true })
  const { roomId } = await params
  return closeTogetherRoom(request, env as Record<string, unknown>, roomId)
}

export async function OPTIONS() {
  return togetherOptions()
}
