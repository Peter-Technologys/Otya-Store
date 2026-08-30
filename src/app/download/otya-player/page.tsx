import type { Metadata } from 'next'
import { DownloadPageClient } from './DownloadButtons'

export const metadata: Metadata = {
  title: 'Download Otya — Android Media Player',
  description: 'Download Otya for supported Android devices. Offline-first video and music playback, Transfer, Private and media tools.',
  alternates: { canonical: 'https://petersmartlink.com/download/otya-player' },
}

export default function DownloadPage() {
  return <DownloadPageClient />
}
