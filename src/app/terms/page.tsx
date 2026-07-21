import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Terms of Service — PeterSmart Technologies',
  description: 'Terms and conditions for using petersmartlink.com and PeterSmart Technologies services.',
  alternates: { canonical: 'https://petersmartlink.com/terms' },
}

const SECTIONS = [
  { icon: '✅', title: 'Acceptance of Terms', body: 'By accessing or using petersmartlink.com, you agree to be bound by these Terms and Conditions.' },
  { icon: '🛠️', title: 'Services', body: 'PeterSmart Technologies provides mobile money services, phone sales, phone repairs, data bundles, and software including OTYA Player — a free offline media player for Android.' },
  { icon: '🚫', title: 'Prohibited Use', body: 'You may not use our platform to publish false content, process fraudulent transactions, or violate any applicable Ugandan law.' },
  { icon: '⚠️', title: 'Limitation of Liability', body: 'PeterSmart Technologies is not liable for any indirect, incidental or consequential damages arising from your use of our services.' },
  { icon: '🇺🇬', title: 'Governing Law', body: 'These terms are governed by the laws of the Republic of Uganda.' },
  { icon: '📧', title: 'Contact', body: 'For questions: hello@petersmartlink.com · WhatsApp +256 775 912 582.' },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <SiteNav />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--text)' }}>Terms of Service</h1>
          <p className="text-sm" style={{ color: 'var(--text-sub)' }}>Last updated: July 2026 · PeterSmart Technologies</p>
        </div>
        <div className="space-y-4">
          {SECTIONS.map(s => (
            <div key={s.title} className="flex gap-4 p-5 rounded-2xl border"
              style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
              <span className="text-2xl flex-shrink-0 mt-0.5">{s.icon}</span>
              <div>
                <h2 className="font-bold text-sm mb-1.5" style={{ color: 'var(--text)' }}>{s.title}</h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-sub)' }}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-4 text-sm pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
          <a href="/privacy" className="font-semibold" style={{ color: 'var(--purple)' }}>Privacy Policy</a>
          <a href="/contact" className="font-semibold" style={{ color: 'var(--purple)' }}>Contact Us</a>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
