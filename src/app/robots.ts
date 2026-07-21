import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/apk/',
          '/_next/',
          '/apps/played',       // redirects to /apps/otya-player
          '/apps/otya-player/changelog', // redirects to /download/otya-player
        ],
      },
    ],
    sitemap: 'https://petersmartlink.com/sitemap.xml',
  }
}
