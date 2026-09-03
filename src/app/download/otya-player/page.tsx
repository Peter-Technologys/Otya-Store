import type { Metadata } from 'next'
import { DownloadPageClient } from './DownloadButtons'

export const metadata: Metadata = {
  title: 'Download Otya Player for Android',
  description:
    'Download the official Otya Player for Android from PeterSmart Link. Play local music and video offline, use nearby Transfer, Private media and practical media tools.',
  keywords: [
    'download Otya Player',
    'Otya Player Android',
    'Otya APK',
    'offline music player Android',
    'offline video player Android',
    'PeterSmart Link Otya',
  ],
  alternates: { canonical: 'https://petersmartlink.com/download/otya-player' },
  openGraph: {
    type: 'website',
    url: 'https://petersmartlink.com/download/otya-player',
    title: 'Download Otya Player for Android',
    description:
      'Official Android download for Otya Player by PeterSmart Link — local music and video, offline playback, nearby Transfer and Private media.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Otya Player for Android',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Download Otya Player for Android',
    description: 'Official Otya Player Android download from PeterSmart Link.',
    images: ['/og-image.jpg'],
  },
}

export default function DownloadOtyaPlayerPage() {
  return <DownloadPageClient />
}
