import type { Metadata } from 'next'
import { DownloadPageClient } from './DownloadButtons'

export const metadata: Metadata = {
  title: 'Download OTYA Player — Free Android App',
  description: 'Download OTYA Player for free. Works on all Android phones. Free offline music and video player built in Uganda.',
  alternates: { canonical: 'https://petersmartlink.com/download/otya-player' },
}

export default function DownloadPage() {
  return <DownloadPageClient />
}
