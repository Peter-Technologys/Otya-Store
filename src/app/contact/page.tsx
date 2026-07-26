import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Contact Us — PeterSmart Technologies',
  description: 'Contact PeterSmart Technologies in Mbirizi, Lwengo District, Uganda.',
  alternates: { canonical: 'https://petersmartlink.com/contact' },
}

const WA = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'

export default function ContactPage() {
  return (
    <div className="min-h-screen relative" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
      <div className="cosmos-stars" />
      <SiteNav />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 relative z-10">
        <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--cosmos-text-primary)' }}>Contact Us</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--cosmos-text-secondary)' }}>PeterSmart Technologies · Mbirizi Town Council, Lwengo District, Uganda</p>
        <div className="space-y-3 mb-8">
          <a href="https://wa.me/256775912582?text=Hi PeterSmart!"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 rounded-2xl border transition-all hover:shadow-lg hover:-translate-y-0.5 hover:border-green-300"
            style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#25d366' }}>
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d={WA} /></svg>
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: 'var(--cosmos-text-primary)' }}>WhatsApp — Fastest response</div>
              <div className="text-sm" style={{ color: 'var(--cosmos-text-secondary)' }}>+256 775 912 582</div>
            </div>
          </a>
          <a href="mailto:support@petersmartlink.com"
            className="flex items-center gap-4 p-5 rounded-2xl border transition-all hover:shadow-lg hover:-translate-y-0.5 hover:border-purple-300"
            style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--cosmos-surface)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ color: 'var(--cosmos-primary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: 'var(--cosmos-text-primary)' }}>Email</div>
              <div className="text-sm" style={{ color: 'var(--cosmos-text-secondary)' }}>support@petersmartlink.com</div>
            </div>
          </a>
          <div className="flex items-center gap-4 p-5 rounded-2xl border"
            style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--cosmos-surface)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ color: 'var(--cosmos-primary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: 'var(--cosmos-text-primary)' }}>Location</div>
              <div className="text-sm" style={{ color: 'var(--cosmos-text-secondary)' }}>Mbirizi Town Council, Lwengo District, Uganda</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border p-5" style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }}>
          <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--cosmos-text-primary)' }}>Business Hours</h2>
          <div className="space-y-2 text-sm">
            {[['Monday – Friday', '8:00 AM – 8:00 PM'], ['Saturday', '8:00 AM – 9:00 PM'], ['Sunday', '10:00 AM – 6:00 PM']].map(([d, h]) => (
              <div key={d} className="flex justify-between">
                <span style={{ color: 'var(--cosmos-text-secondary)' }}>{d}</span>
                <span className="font-semibold" style={{ color: 'var(--cosmos-text-primary)' }}>{h}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
