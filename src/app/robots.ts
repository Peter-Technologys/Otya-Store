import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Block API routes, internal Next.js paths, and duplicate /apps/otya-player
        // (canonical is /otya-player) to avoid duplicate content crawling
        disallow: [
          '/api/',
          '/version',
          '/latest',
          '/stats',
          '/apk/',
          '/download',
          '/apps/otya-player',   // redirect to /otya-player — avoid duplicate
          '/apps/played',        // internal, no public value
          '/_next/',
        ],
      },
    ],
    sitemap: 'https://petersmartlink.com/sitemap.xml',
  }
}
