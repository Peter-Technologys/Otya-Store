import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Privacy Policy | PeterSmart Link',
  description: 'Privacy information for PeterSmart Link websites, applications and connected services.',
  alternates: { canonical: 'https://petersmartlink.com/privacy' },
}

const SECTIONS = [
  { title: 'Who We Are', body: 'PeterSmart Link operates petersmartlink.com and connected products and services. We are based in Uganda. Privacy questions can be sent to support@petersmartlink.com.' },
  { title: 'Local Media and Device Data', body: 'OTYA Player primarily works with media stored on your device. Your local media files are not uploaded to PeterSmart Link simply because you play, browse or organize them. Some technical metadata may be processed when you use optional online features.' },
  { title: 'Information We May Collect', body: 'Depending on the feature you use, we may process account details, device and app version information, installation identifiers, update/download telemetry, feedback, crash diagnostics, support messages and data you intentionally submit to an online service.' },
  { title: 'How We Use Information', body: 'We use information to provide and secure services, synchronize optional account features, deliver updates, diagnose failures, respond to support requests, prevent abuse and improve reliability. We do not sell personal information.' },
  { title: 'Storage and Infrastructure', body: 'PeterSmart Link uses cloud infrastructure including Cloudflare services such as Workers, D1, KV and R2 where appropriate. Some email delivery functions may use Resend. Data is retained only as needed for the relevant service, security, support or legal purpose.' },
  { title: 'Third-Party Services', body: 'Optional integrations may involve third-party providers. When you choose to use those features, the provider may process information under its own privacy terms.' },
  { title: 'Your Choices and Rights', body: 'You may request access, correction or deletion of personal information associated with PeterSmart Link services, subject to applicable law and technical or security requirements.' },
  { title: 'Contact', body: 'For privacy questions or requests, contact support@petersmartlink.com.' },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <SiteNav />
      <main className="max-w-2xl mx-auto px-5 sm:px-6 py-12 sm:py-16">
        <header className="mb-10">
          <div className="text-xs font-bold tracking-[0.16em] uppercase mb-3" style={{ color: 'var(--cosmos-primary)' }}>Privacy</div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2">Privacy Policy</h1>
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
          <a href="/terms" className="font-semibold" style={{ color: 'var(--purple)' }}>Terms of Service</a>
          <a href="/contact" className="font-semibold" style={{ color: 'var(--purple)' }}>Contact Us</a>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
