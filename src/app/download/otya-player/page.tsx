import type { Metadata } from 'next'
import { DownloadPageClient } from './DownloadButtons'

export const metadata: Metadata = {
  title: 'Download OTYA — Android Media Player',
  description: 'Download OTYA for supported Android devices. Offline-first local video and music playback, Transfer, Private, Search and media tools.',
  alternates: { canonical: 'https://petersmartlink.com/download/otya-player' },
}

export default function DownloadPage() {
  return <DownloadPageClient />
}
