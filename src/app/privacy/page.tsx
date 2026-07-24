import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Privacy Policy — PeterSmart Technologies',
  description: 'Privacy policy for PeterSmart Technologies and petersmartlink.com.',
  alternates: { canonical: 'https://petersmartlink.com/privacy' },
}

const SECTIONS = [
  { icon: '🏢', title: 'Who We Are', body: 'PeterSmart Technologies operates petersmartlink.com. We are based in Mbirizi Town Council, Lwengo District, Uganda. Contact: hello@petersmartlink.com' },
  { icon: '📊', title: 'Data We Collect', body: 'We collect account data (name, email, phone when you register), business data (name, address, products, blog posts), transaction data (sales records), and basic usage data.' },
  { icon: '⚙️', title: 'How We Use Your Data', body: 'We use your data to provide and improve our services, display your business on the platform, send account notifications, and comply with Ugandan law. We do not sell your data.' },
  { icon: '💾', title: 'Data Storage', body: 'Your data is stored on Cloudflare D1 (database) and R2 (file storage). We do not sell your data to third parties.' },
  { icon: '🛡️', title: 'Your Rights', body: 'You have the right to access, correct, delete and export your personal data at any time. Contact us at hello@petersmartlink.com.' },
  { icon: '📧', title: 'Contact', body: 'For privacy questions: hello@petersmartlink.com · WhatsApp +256 775 912 582 · Mbirizi Town Council, Lwengo District, Uganda.' },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <SiteNav />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--text)' }}>Privacy Policy</h1>
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
          <a href="/terms" className="font-semibold" style={{ color: 'var(--purple)' }}>Terms of Service</a>
          <a href="/contact" className="font-semibold" style={{ color: 'var(--purple)' }}>Contact Us</a>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
