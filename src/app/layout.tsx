import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Manrope } from 'next/font/google'
import ThemeControl from './ThemeControl'
import './globals.css'
import './brand-overrides.css'

const manrope = Manrope({ subsets: ['latin'], display: 'swap', variable: '--font-otya' })
const SITE_URL = 'https://petersmartlink.com'
const APP_VERSION = '1.0.0'
const ADSENSE_ID = 'ca-pub-2517163652161686'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Otya — Media, music and intelligent assistance', template: '%s | Otya' },
  description: 'Otya is a modern media and AI experience for Android and the web: play your own music and videos, discover music online, transfer files, protect private media and use Otya when you need intelligent help.',
  keywords: ['Otya', 'Otya Android', 'Otya media player', 'Otya AI', 'offline music player', 'offline video player', 'music discovery', 'file transfer Android', 'private media', 'Uganda technology'],
  authors: [{ name: 'Otya', url: SITE_URL }],
  creator: 'Otya',
  publisher: 'Otya',
  applicationName: 'Otya',
  category: 'multimedia',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
  openGraph: {
    type: 'website', locale: 'en_UG', url: SITE_URL, siteName: 'Otya',
    title: 'Otya — Media, music and intelligent assistance',
    description: 'A modern Android and web experience for media, music discovery, transfer, private content and Otya intelligence.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Otya', type: 'image/jpeg' }],
  },
  twitter: { card: 'summary_large_image', title: 'Otya — Media, music and intelligent assistance', description: 'Media, music discovery, transfer, private content and intelligent help.', images: ['/og-image.jpg'] },
  icons: {
    icon: [
      { url: '/otya-icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'Otya', statusBarStyle: 'black-translucent' },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F8FB' },
    { media: '(prefers-color-scheme: dark)', color: '#080B12' },
  ],
  width: 'device-width', initialScale: 1, maximumScale: 5,
}

const schemaOrg = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Otya',
      url: SITE_URL,
      logo: `${SITE_URL}/otya-icon.svg`,
      email: 'support@petersmartlink.com',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#otya`,
      name: 'Otya',
      alternateName: 'com.otyaplayer.app',
      operatingSystem: 'Android',
      applicationCategory: 'MultimediaApplication',
      softwareVersion: APP_VERSION,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      url: `${SITE_URL}/otya-player`,
      downloadUrl: `${SITE_URL}/download/otya-player`,
      author: { '@id': `${SITE_URL}/#organization` },
      description: 'Modern Android media experience with offline music and video playback, online music discovery, file transfer, private media and Otya intelligence.',
      image: `${SITE_URL}/otya-icon.svg`,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'Otya',
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/music?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
    },
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
