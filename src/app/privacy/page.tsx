import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Privacy Policy | OTYA',
  description: 'Privacy information for OTYA accounts, local media, online music, AI, support and connected services.',
  alternates: { canonical: 'https://petersmartlink.com/privacy' },
}

const SECTIONS = [
  { title: 'Who We Are', body: 'OTYA is developed and operated by PeterSmart Link in Uganda. This policy covers the shared OTYA account and connected OTYA services. Privacy questions can be sent to support@petersmartlink.com.' },
  { title: 'One OTYA Account', body: 'Your OTYA account provides one identity across OTYA products. Each product keeps its own product-specific data separately scoped under the same account ID; signing into one product does not automatically give another product access to all of its private data.' },
  { title: 'Local Media and Device Data', body: 'OTYA Player primarily works with media stored on your device. Your local media files are not uploaded simply because you play, browse, search or organize them. Local playback and local Search are designed to work without a cloud account.' },
  { title: 'Online Music', body: 'When you intentionally use Online Music, OTYA may send a search term and basic technical request information to OTYA infrastructure and the selected music provider so matching tracks can be returned. Provider track metadata, artwork, stream links, source links and license information may be displayed in OTYA. OTYA does not upload your local music library to the provider for ordinary online search.' },
  { title: 'Music Provider Accounts', body: 'Public online catalog playback does not require a provider account unless provider requirements change. If you explicitly connect a provider account, OTYA processes the authorization result needed for that connection. Reusable provider tokens are stored server-side in encrypted form and are not placed in the Android app or exposed to public pages.' },
  { title: 'Information We May Collect', body: 'Depending on the feature you use, OTYA may process account details, optional verified phone and recovery information, linked identities, device and app version information, installation identifiers, update/download telemetry, AI conversation data for signed-in saved chats, feedback, crash diagnostics, support messages, online music search requests and data you intentionally submit to an online service.' },
  { title: 'Phone and Linked Identities', body: 'Phone verification is optional. When you choose Telegram verification, OTYA records a phone number as verified only after a server-validated Telegram verification result. Linked identity information is used for account security and sign-in or recovery features and is not a substitute for unrelated product permissions.' },
  { title: 'AI and Support', body: 'Guest AI chats are intended to be temporary. Signed-in AI conversations may be stored so they can be restored to that OTYA account. Private administrator tools such as Gmail, infrastructure and support operations are not exposed to customer AI sessions.' },
  { title: 'How We Use Information', body: 'We use information to provide and secure OTYA, return requested online content, synchronize optional account features, deliver updates, diagnose failures, answer support requests, prevent abuse and improve reliability. We do not sell personal information.' },
  { title: 'Storage and Infrastructure', body: 'OTYA uses cloud infrastructure including Cloudflare services such as Workers, D1, KV, R2 and queues where appropriate. Transactional and support email may use Resend. Optional services may use Firebase for approved client functions. Data is retained only as needed for the relevant service, security, support or legal purpose.' },
  { title: 'Third-Party Services', body: 'Optional integrations may involve providers such as Google, Telegram, Firebase, Resend and online music providers. When you choose to use those features, the provider may process information under its own privacy terms. OTYA should request only the permissions or data needed for the selected feature and should preserve provider attribution where required.' },
  { title: 'Your Choices and Rights', body: 'You may choose not to use Online Music, Ask OTYA or provider account linking and continue using core local playback. You may also request access, correction, deletion or export of personal information associated with your OTYA account, subject to applicable law and identity/security requirements.' },
  { title: 'Contact', body: 'For privacy questions or requests, contact support@petersmartlink.com.' },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <SiteNav />
      <main className="max-w-2xl mx-auto px-5 sm:px-6 py-12 sm:py-16">
        <header className="mb-10">
          <div className="text-xs font-bold tracking-[0.16em] uppercase mb-3" style={{ color: 'var(--cosmos-primary)' }}>OTYA · Privacy</div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2">Privacy Policy</h1>
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
          <a href="/terms" className="font-semibold" style={{ color: 'var(--purple)' }}>Terms of Service</a>
          <a href="/docs/online-music" className="font-semibold" style={{ color: 'var(--purple)' }}>Online Music</a>
          <a href="/docs" className="font-semibold" style={{ color: 'var(--purple)' }}>Docs</a>
          <a href="/contact" className="font-semibold" style={{ color: 'var(--purple)' }}>Contact Us</a>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
