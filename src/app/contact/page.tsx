import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteNav, PageWrapper } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Contact Us - PeterSmart Link',
  description: 'Contact PeterSmart Technologies in Mbirizi, Lwengo District, Uganda.',
}

export default function ContactPage() {
  return (
    <PageWrapper>
      <SiteNav back={{ href: '/', label: 'PeterSmart Link' }} />
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--text)' }}>Contact Us</h1>
          <p style={{ color: 'var(--text-sub)' }}>PeterSmart Technologies - Mbirizi Town Council, Lwengo District, Uganda</p>
        </div>
        <div className="space-y-4">
          {[
            { href: 'https://wa.me/256775912582', icon: '💬', title: 'WhatsApp', sub: '+256 775 912 582', note: 'Fastest response - tap to chat', color: 'border-green-200 bg-green-50' },
            { href: 'tel:+256775912582', icon: '📞', title: 'Phone Call', sub: '+256 775 912 582', note: '', color: 'border-purple-200 bg-purple-50' },
            { href: 'mailto:hello@petersmartlink.com', icon: '✉️', title: 'Email', sub: 'hello@petersmartlink.com', note: '', color: 'border-blue-200 bg-blue-50' },
          ].map(c => (
            <a key={c.title} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
              className={`flex items-center gap-4 p-5 rounded-2xl border transition-all hover:shadow-md ${c.color}`}>
              <div className="text-2xl">{c.icon}</div>
              <div>
                <div className="font-semibold" style={{ color: 'var(--text)' }}>{c.title}</div>
                <div className="text-sm text-purple-600">{c.sub}</div>
                {c.note && <div className="text-xs mt-0.5" style={{ color: 'var(--text-sub)' }}>{c.note}</div>}
              </div>
            </a>
          ))}
          <div className="flex items-center gap-4 p-5 rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <div className="text-2xl">📍</div>
            <div>
              <div className="font-semibold" style={{ color: 'var(--text)' }}>Location</div>
              <div className="text-sm" style={{ color: 'var(--text-sub)' }}>Mbirizi Town Council, Lwengo District, Uganda</div>
            </div>
          </div>
        </div>
        <div className="mt-8 p-5 rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <h3 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>Business Hours</h3>
          <div className="space-y-2 text-sm">
            {[['Monday - Friday', '8:00 AM - 8:00 PM'], ['Saturday', '8:00 AM - 9:00 PM'], ['Sunday', '10:00 AM - 6:00 PM']].map(([d, h]) => (
              <div key={d} className="flex justify-between">
                <span style={{ color: 'var(--text-sub)' }}>{d}</span>
                <span style={{ color: 'var(--text)' }}>{h}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
