import { getCloudflareContext } from '@opennextjs/cloudflare'
import type { NextRequest } from 'next/server'
import {
  pollTogetherSignals,
  sendTogetherSignal,
  togetherOptions,
} from '@/lib/together-control'

type Context = { params: Promise<{ roomId: string }> }

export async function GET(request: NextRequest, { params }: Context) {
  const { env } = await getCloudflareContext({ async: true })
  const { roomId } = await params
  return pollTogetherSignals(request, env as Record<string, unknown>, roomId)
}

export async function POST(request: NextRequest, { params }: Context) {
  const { env } = await getCloudflareContext({ async: true })
  const { roomId } = await params
  return sendTogetherSignal(request, env as Record<string, unknown>, roomId)
}

export async function OPTIONS() {
  return togetherOptions()
}
