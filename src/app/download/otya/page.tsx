import type { Metadata } from 'next'
import { DownloadPageClient } from '../otya-player/DownloadButtons'

export const metadata: Metadata = {
  title: 'Download Otya',
  description: 'Download Otya for Android.',
  alternates: { canonical: 'https://petersmartlink.com/download/otya' },
}

export default function DownloadOtyaPage() {
  return <DownloadPageClient />
}
