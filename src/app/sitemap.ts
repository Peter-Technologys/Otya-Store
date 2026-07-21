import type { MetadataRoute } from 'next'

const BASE = 'https://petersmartlink.com'
const NOW = new Date()

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // Company
    { url: BASE,                           lastModified: NOW, changeFrequency: 'monthly', priority: 1.0 },
    { url: `${BASE}/services`,             lastModified: NOW, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/contact`,              lastModified: NOW, changeFrequency: 'yearly',  priority: 0.6 },
    { url: `${BASE}/blog`,                 lastModified: NOW, changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${BASE}/privacy`,              lastModified: NOW, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/terms`,                lastModified: NOW, changeFrequency: 'yearly',  priority: 0.3 },
    // OTYA Player — main pages
    { url: `${BASE}/otya-player`,          lastModified: NOW, changeFrequency: 'monthly', priority: 0.95 },
    { url: `${BASE}/download/otya-player`, lastModified: NOW, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/apps/otya-player/support`,  lastModified: NOW, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/apps/otya-player/privacy`,  lastModified: NOW, changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${BASE}/apps/otya-player/terms`,    lastModified: NOW, changeFrequency: 'yearly',  priority: 0.4 },
  ]
}
