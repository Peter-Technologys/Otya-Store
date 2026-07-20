import type { MetadataRoute } from 'next'

const BASE = 'https://petersmartlink.com'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // Company pages
    { url: BASE,                                    lastModified: new Date(), changeFrequency: 'monthly',  priority: 1.0 },
    { url: `${BASE}/services`,                      lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.7 },
    { url: `${BASE}/contact`,                       lastModified: new Date(), changeFrequency: 'yearly',   priority: 0.6 },
    { url: `${BASE}/blog`,                          lastModified: new Date(), changeFrequency: 'weekly',   priority: 0.6 },
    { url: `${BASE}/privacy`,                       lastModified: new Date(), changeFrequency: 'yearly',   priority: 0.3 },
    { url: `${BASE}/terms`,                         lastModified: new Date(), changeFrequency: 'yearly',   priority: 0.3 },
    // OTYA Player
    { url: `${BASE}/otya-player`,                   lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.95 },
    { url: `${BASE}/download/otya-player`,          lastModified: new Date(), changeFrequency: 'weekly',   priority: 0.9 },
    { url: `${BASE}/apps/otya-player/changelog`,    lastModified: new Date(), changeFrequency: 'weekly',   priority: 0.8 },
    { url: `${BASE}/apps/otya-player/support`,      lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.7 },
    { url: `${BASE}/apps/otya-player/privacy`,      lastModified: new Date(), changeFrequency: 'yearly',   priority: 0.4 },
    { url: `${BASE}/apps/otya-player/terms`,        lastModified: new Date(), changeFrequency: 'yearly',   priority: 0.4 },
  ]
}
