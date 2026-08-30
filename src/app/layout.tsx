import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Manrope } from 'next/font/google'
import ThemeControl from './ThemeControl'
import './globals.css'

const manrope = Manrope({ subsets: ['latin'], display: 'swap', variable: '--font-otya' })
const SITE_URL = 'https://petersmartlink.com'
const APP_VERSION = '1.7.0'
const ADSENSE_ID = 'ca-pub-2517163652161686'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Otya — Music first. Player everywhere.', template: '%s | Otya' },
  description: 'Discover and play music online with Otya, then take your own music and videos offline with Otya Player for Android.',
  keywords: ['Otya', 'Otya Player', 'Otya Music', 'Ask Otya', 'offline media player Android', 'music player Uganda', 'video player Android', 'Ugandan music'],
  authors: [{ name: 'Otya', url: SITE_URL }],
  creator: 'Otya',
  publisher: 'Otya',
  applicationName: 'Otya',
  category: 'music',
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
  openGraph: {
    type: 'website', locale: 'en_UG', url: SITE_URL, siteName: 'Otya',
    title: 'Otya — Music first. Player everywhere.',
    description: 'Music discovery on the web and an offline-first Android player for your own library.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Otya', type: 'image/jpeg' }],
  },
  twitter: { card: 'summary_large_image', title: 'Otya — Music first. Player everywhere.', description: 'Music discovery on the web and an offline-first Android player.', images: ['/og-image.jpg'] },
  icons: {
    icon: [{ url: '/favicon.ico' }, { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }, { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }], shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'Otya', statusBarStyle: 'black-translucent' },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#eee9fb' },
    { media: '(prefers-color-scheme: dark)', color: '#090812' },
  ],
  width: 'device-width', initialScale: 1, maximumScale: 5,
}

const schemaOrg = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: 'Otya', url: SITE_URL, logo: { '@type': 'ImageObject', url: `${SITE_URL}/android-chrome-512x512.png`, width: 512, height: 512 } },
    { '@type': 'MobileApplication', '@id': `${SITE_URL}/#otyaplayer`, name: 'Otya Player', alternateName: 'com.otyaplayer.app', operatingSystem: 'Android', applicationCategory: 'MultimediaApplication', softwareVersion: APP_VERSION, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, url: `${SITE_URL}/otya-player`, downloadUrl: `${SITE_URL}/download/otya-player`, author: { '@id': `${SITE_URL}/#organization` }, description: 'Offline-first Android music and video player with Transfer, Private media and optional connected features.', image: `${SITE_URL}/android-chrome-512x512.png` },
    { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: SITE_URL, name: 'Otya', publisher: { '@id': `${SITE_URL}/#organization` }, potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/music?q={search_term_string}`, 'query-input': 'required name=search_term_string' } },
  ],
}

const initialThemeScript = `try {
  var migrated = localStorage.getItem('otya_theme_device_v3');
  if (!migrated) {
    localStorage.setItem('otya_theme', 'system');
    localStorage.setItem('otya_theme_device_v3', '1');
  }
  var t = localStorage.getItem('otya_theme') || 'system';
  if (t === 'light' || t === 'dark') {
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.style.colorScheme = t;
  } else {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = 'light dark';
  }
} catch (e) {}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" dir="ltr" className={manrope.variable} suppressHydrationWarning>
    <head>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }} />
      <meta name="google-adsense-account" content={ADSENSE_ID} />
      <script dangerouslySetInnerHTML={{ __html: initialThemeScript }} />
    </head>
    <body className={manrope.className}>
      {children}
      <ThemeControl />
      <Script id="google-adsense" async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`} crossOrigin="anonymous" strategy="afterInteractive" />
    </body>
  </html>
}
