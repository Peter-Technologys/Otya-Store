import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Terms of Service | OTYA',
  description: 'Terms and conditions for using the shared OTYA account, OTYA products, AI and connected services.',
  alternates: { canonical: 'https://petersmartlink.com/terms' },
}

const SECTIONS = [
  { title: 'Acceptance of Terms', body: 'By accessing or using OTYA websites, accounts, applications or connected services, you agree to these Terms of Service and applicable product-specific policies.' },
  { title: 'OTYA Account', body: 'One OTYA account may be used across OTYA products. Product-specific data and permissions remain separately scoped even when the same account identity is used.' },
  { title: 'Services', body: 'OTYA includes products and services such as OTYA Player, OTYA AI, support, downloads, account services and future OTYA products made available through official channels.' },
  { title: 'AI Features', body: 'OTYA AI may generate incorrect or incomplete information. Users should verify important information. Customer AI does not receive access to private administrator tools merely because those tools exist in OTYA Console.' },
  { title: 'Prohibited Use', body: 'You may not use OTYA for fraud, abuse, unauthorized access, unlawful content, infringement, interference with service operation, attempts to obtain secrets or other activity that violates applicable law.' },
  { title: 'Software and Updates', body: 'Software features, availability and requirements may change over time. Updates may be provided to improve security, compatibility, performance and functionality. OTYA Player is designed so core local playback remains usable without requiring AI.' },
  { title: 'Third-Party Services', body: 'Some optional features may interact with third-party providers. Their own terms and privacy practices may apply when you choose to connect or use those integrations.' },
  { title: 'Limitation of Liability', body: 'To the extent permitted by law, PeterSmart Link, as the developer and operator of OTYA, is not responsible for indirect, incidental or consequential losses resulting from use of the services.' },
  { title: 'Governing Law', body: 'These terms are governed by the applicable laws of the Republic of Uganda.' },
  { title: 'Contact', body: 'Questions about these terms can be sent to support@petersmartlink.com.' },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <SiteNav />
      <main className="max-w-2xl mx-auto px-5 sm:px-6 py-12 sm:py-16">
        <header className="mb-10">
          <div className="text-xs font-bold tracking-[0.16em] uppercase mb-3" style={{ color: 'var(--cosmos-primary)' }}>OTYA · Legal</div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2">Terms of Service</h1>
          <p className="text-sm" style={{ color: 'var(--text-sub)' }}>Last updated: August 28, 2026 · OTYA</p>
        </header>

        <div className="space-y-4">
          {SECTIONS.map((section, index) => (
            <section key={section.title} className="p-5 sm:p-6 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-black" style={{ background: 'rgba(139,92,246,.12)', color: 'var(--cosmos-primary)' }}>
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div>
                  <h2 className="font-bold text-sm mb-1.5">{section.title}</h2>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-sub)' }}>{section.body}</p>
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-sm pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
          <a href="/privacy" className="font-semibold" style={{ color: 'var(--purple)' }}>Privacy Policy</a>
          <a href="/documents" className="font-semibold" style={{ color: 'var(--purple)' }}>Documents</a>
          <a href="/contact" className="font-semibold" style={{ color: 'var(--purple)' }}>Contact Us</a>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
