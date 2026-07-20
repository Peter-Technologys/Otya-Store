import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const SITE_URL  = 'https://petersmartlink.com'
const SITE_NAME = 'OTYA Player'
const ADSENSE_ID = 'ca-pub-2517163652161686'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:  'OTYA Player - Free Offline Media Player for Android | PeterSmart Technologies',
    template: '%s | OTYA Player',
  },
  description:
    'OTYA Player is a free offline media player for Android built in Uganda. ' +
    'Play music and videos without internet, share files via Flash Share, ' +
    'protect private media in an encrypted Vault, and stream your library to any PC browser on Wi-Fi. ' +
    'Download the free APK now.',
  keywords: [
    'OTYA Player', 'offline media player Android', 'free music player Uganda',
    'free video player Android', 'com.otyaplayer.app', 'PeterSmart Technologies',
    'Flash Share file sharing', 'Web Mirror Android', 'Private Vault Android',
    'offline media player Uganda', 'Mbirizi Uganda', 'download OTYA Player APK',
  ],
  authors:         [{ name: 'PeterSmart Technologies', url: SITE_URL }],
  creator:         'PeterSmart Technologies',
  publisher:       'PeterSmart Technologies',
  applicationName: SITE_NAME,
  category:        'technology',
  alternates: { canonical: SITE_URL },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  openGraph: {
    type: 'website', locale: 'en_UG', url: SITE_URL, siteName: 'PeterSmart Technologies',
    title: 'OTYA Player - Free Offline Media Player for Android',
    description: 'Free offline music & video player for Android. Flash Share, Private Vault, Web Mirror. Built in Uganda.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'OTYA Player - Free Offline Media Player for Android', type: 'image/jpeg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OTYA Player - Free Offline Media Player for Android',
    description: 'Free offline music & video player. Flash Share, Vault, Web Mirror. Built in Uganda.',
    images: ['/og-image.jpg'], creator: '@PeterSmartLink',
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png',          sizes: '16x16',   type: 'image/png' },
      { url: '/favicon-32x32.png',          sizes: '32x32',   type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png', shortcut: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#7C3AED' }, { media: '(prefers-color-scheme: dark)', color: '#7C3AED' }],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className={inter.className}>
        {children}
        <Script id="google-adsense" async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`} crossOrigin="anonymous" strategy="afterInteractive" />
      </body>
    </html>
  )
}
