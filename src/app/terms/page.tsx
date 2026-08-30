import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Terms of Service | OTYA',
  description: 'Terms and conditions for using OTYA, including accounts, AI, online music and connected services.',
  alternates: { canonical: 'https://petersmartlink.com/terms' },
}

const SECTIONS = [
  { title: 'Acceptance of Terms', body: 'By accessing or using OTYA websites, accounts, applications or connected services, you agree to these Terms of Service and applicable product-specific policies.' },
  { title: 'OTYA Account', body: 'One OTYA account may be used across OTYA products. Product-specific data and permissions remain separately scoped even when the same account identity is used. Core local OTYA Player playback does not require an account.' },
  { title: 'Optional Verification', body: 'OTYA may offer optional email, phone or linked-identity verification for account security and recovery. Verification methods may rely on third-party providers such as Google or Telegram. A phone number is not required for core local playback.' },
  { title: 'Services', body: 'OTYA includes OTYA Player, website services, Online Music, Ask OTYA, support, downloads, account services and other official OTYA features made available through approved channels.' },
  { title: 'Online Music and Third-Party Content', body: 'Online Music may display or stream tracks supplied by third-party music providers. Those tracks remain subject to the creator’s license and the provider’s terms. OTYA does not claim ownership of third-party music. Creator/provider attribution, source links and license information may be shown where required. Availability may vary by track, provider, country, license or provider policy.' },
  { title: 'Downloads', body: 'A music Download action is offered only when the provider reports that downloading the selected track is permitted and provides a valid download source. The absence of a Download action means OTYA is not offering that track for download. Users must respect the applicable creator license and provider terms after downloading.' },
  { title: 'Provider Accounts', body: 'A third-party music account is not required for ordinary public catalog playback unless the provider changes its requirements. Optional account linking is separate from the OTYA account and requires explicit user authorization. Third-party account use remains subject to that provider’s own terms.' },
  { title: 'AI Features', body: 'Ask OTYA may generate incorrect or incomplete information. Users should verify important information. Customer AI does not receive access to private administrator tools merely because those tools exist in OTYA Console.' },
  { title: 'Prohibited Use', body: 'You may not use OTYA for fraud, abuse, unauthorized access, unlawful distribution, copyright infringement, circumvention of provider restrictions, interference with service operation, attempts to obtain secrets or other activity that violates applicable law.' },
  { title: 'Software and Updates', body: 'Software features, availability and requirements may change over time. Updates may improve security, compatibility, performance and functionality. OTYA Player is designed so core local playback remains usable without requiring AI, Online Music or a cloud account.' },
  { title: 'Third-Party Services', body: 'Optional features may interact with services such as Google, Telegram, Firebase, Resend, Cloudflare and music providers. Their own terms and privacy practices may apply when you choose to use those integrations. OTYA may disable or modify an integration if provider terms, licensing, availability, security or technical requirements change.' },
  { title: 'Limitation of Liability', body: 'To the extent permitted by law, PeterSmart Link, as the developer and operator of OTYA, is not responsible for indirect, incidental or consequential losses resulting from use of the services or from third-party content or provider availability.' },
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
          <p className="text-sm" style={{ color: 'var(--text-sub)' }}>Last updated: August 30, 2026 · OTYA</p>
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
          <a href="/docs/online-music" className="font-semibold" style={{ color: 'var(--purple)' }}>Online Music</a>
          <a href="/docs" className="font-semibold" style={{ color: 'var(--purple)' }}>Docs</a>
          <a href="/contact" className="font-semibold" style={{ color: 'var(--purple)' }}>Contact Us</a>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
