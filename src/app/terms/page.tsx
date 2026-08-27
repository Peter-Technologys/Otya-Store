import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Terms of Service | PeterSmart Link',
  description: 'Terms and conditions for using PeterSmart Link websites, apps and services.',
  alternates: { canonical: 'https://petersmartlink.com/terms' },
}

const SECTIONS = [
  { title: 'Acceptance of Terms', body: 'By accessing or using PeterSmart Link websites, applications or services, you agree to these Terms of Service and applicable policies.' },
  { title: 'Services', body: 'PeterSmart Link provides technology products and services, including software such as OTYA Player, digital services and other offerings presented through our official channels.' },
  { title: 'Prohibited Use', body: 'You may not use our services for fraud, abuse, unauthorized access, unlawful content, infringement, interference with service operation, or any activity that violates applicable law.' },
  { title: 'Software and Updates', body: 'Software features, availability and requirements may change over time. Updates may be provided to improve security, compatibility, performance and functionality.' },
  { title: 'Third-Party Services', body: 'Some features may interact with third-party platforms or providers. Their own terms and privacy practices may apply when you choose to use those integrations.' },
  { title: 'Limitation of Liability', body: 'To the extent permitted by law, PeterSmart Link is not responsible for indirect, incidental or consequential losses resulting from use of the services.' },
  { title: 'Governing Law', body: 'These terms are governed by the applicable laws of the Republic of Uganda.' },
  { title: 'Contact', body: 'Questions about these terms can be sent to support@petersmartlink.com.' },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <SiteNav />
      <main className="max-w-2xl mx-auto px-5 sm:px-6 py-12 sm:py-16">
        <header className="mb-10">
          <div className="text-xs font-bold tracking-[0.16em] uppercase mb-3" style={{ color: 'var(--cosmos-primary)' }}>Legal</div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2">Terms of Service</h1>
          <p className="text-sm" style={{ color: 'var(--text-sub)' }}>Last updated: August 2026 · PeterSmart Link</p>
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
          <a href="/contact" className="font-semibold" style={{ color: 'var(--purple)' }}>Contact Us</a>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
