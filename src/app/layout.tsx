import Link from 'next/link'
import Image from 'next/image'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

const SITE_URL  = 'https://petersmartlink.com'
const ADSENSE_ID = 'ca-pub-2517163652161686'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:  'PeterSmart Technologies — Mobile Money, Phone Sales & OTYA Player | Mbirizi, Uganda',
    template: '%s | PeterSmart Technologies',
  },
  description:
    'PeterSmart Technologies is a tech company in Mbirizi, Uganda. We run a mobile money and phone shop and build OTYA Player — a free offline media player for Android.',
  keywords: [
    'PeterSmart Technologies', 'PeterSmart Link', 'Mbirizi Uganda', 'mobile money Uganda',
    'MTN MoMo Uganda', 'Airtel Money Uganda', 'phone sales Uganda', 'OTYA Player',
    'offline media player Android', 'free music player Uganda', 'free video player Android',
    'com.otyaplayer.app', 'Flash Share', 'Private Vault Android', 'download OTYA Player APK',
    'Lwengo District Uganda', 'Android media player free',
  ],
  authors:         [{ name: 'PeterSmart Technologies', url: SITE_URL }],
  creator:         'PeterSmart Technologies',
  publisher:       'PeterSmart Technologies',
  applicationName: 'OTYA Player',
  category:        'technology',
  alternates: { canonical: SITE_URL },
  robots: {
    index: true, follow: true,
    googleBot: {
      index: true, follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website', locale: 'en_UG', url: SITE_URL,
    siteName: 'PeterSmart Technologies',
    title: 'OTYA Player — Free Offline Media Player for Android',
    description: 'Free offline music & video player for Android. Flash Share, Private Vault, Web Mirror. Built in Uganda by PeterSmart Technologies.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'OTYA Player — Free Offline Media Player for Android', type: 'image/jpeg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OTYA Player — Free Offline Media Player for Android',
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
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'OTYA Player', statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#7C3AED' },
    { media: '(prefers-color-scheme: dark)',  color: '#7C3AED' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

const schemaOrg = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'PeterSmart Technologies',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/web-app-manifest-512x512.png`, width: 512, height: 512 },
      contactPoint: { '@type': 'ContactPoint', telephone: '+256-775-912-582', contactType: 'customer service', areaServed: 'UG', availableLanguage: 'English' },
      sameAs: ['https://wa.me/256775912582', 'https://www.facebook.com/PeterSmartLink', 'https://www.twitter.com/PeterSmartLink'],
    },
    {
      '@type': 'LocalBusiness',
      '@id': `${SITE_URL}/#localbusiness`,
      name: 'PeterSmart Link',
      url: SITE_URL,
      telephone: '+256-775-912-582',
      email: 'support@petersmartlink.com',
      image: `${SITE_URL}/og-image.jpg`,
      priceRange: 'UGX',
      areaServed: 'UG',
      address: { '@type': 'PostalAddress', streetAddress: 'Mbirizi Town Council', addressLocality: 'Mbirizi', addressRegion: 'Lwengo District', addressCountry: 'UG' },
      openingHoursSpecification: [
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '08:00', closes: '20:00' },
        { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '08:00', closes: '21:00' },
        { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Sunday', opens: '10:00', closes: '18:00' },
      ],
    },
    {
      '@type': 'MobileApplication',
      '@id': `${SITE_URL}/#otyaplayer`,
      name: 'OTYA Player',
      alternateName: 'com.otyaplayer.app',
      operatingSystem: 'Android 5.0+',
      applicationCategory: 'MultimediaApplication',
      softwareVersion: '1.4.0',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
      url: `${SITE_URL}/otya-player`,
      downloadUrl: `${SITE_URL}/download/otya-player`,
      author: { '@id': `${SITE_URL}/#organization` },
      description: 'Free offline media player for Android. Play music and videos without internet, share files via Flash Share, protect private media in an encrypted Vault, stream your library to any PC browser on Wi-Fi.',
      featureList: 'Offline playback, Flash Share, Private Vault, Web Mirror, Storage Analyzer, Seasonal Themes, 5-band Equalizer, Picture-in-Picture',
      image: `${SITE_URL}/played-icon.png`,
      releaseNotes: `${SITE_URL}/download/otya-player`,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'PeterSmart Technologies',
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/blog/?search={search_term_string}`, 'query-input': 'required name=search_term_string' },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }} />
      </head>
      <body className={inter.className}>
        {children}
        <Script id="google-adsense" async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`}
          crossOrigin="anonymous" strategy="afterInteractive" />
      </body>
    </html>
  )
}
