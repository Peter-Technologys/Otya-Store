import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/auth/',
          '/apk/',
          '/_next/',
          '/apps/played',
          '/apps/otya-player/changelog',
        ],
      },
    ],
    sitemap: 'https://petersmartlink.com/sitemap.xml',
  }
}