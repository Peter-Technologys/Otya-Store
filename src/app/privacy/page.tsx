import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Privacy | Otya',
  description: 'How Otya handles accounts, local media, online music, AI and connected services.',
  alternates: { canonical: 'https://petersmartlink.com/privacy' },
}

const SECTIONS = [
  ['About Otya', 'Otya is operated from Uganda. This policy covers Otya accounts and connected Otya services. Privacy questions can be sent to support@petersmartlink.com.'],
  ['Your Otya account', 'Your Otya account provides one identity across connected Otya services. Product-specific data and permissions remain separately scoped under the same account ID.'],
  ['Local media', 'Otya Player primarily works with media stored on your device. Local files are not uploaded simply because you play, browse, search or organize them. Core local playback is designed to work without a cloud account.'],
  ['Online music', 'When you intentionally use online music, Otya may send a search term and basic technical request information to Otya infrastructure and the selected provider. Provider metadata, artwork, stream links, source links and license information may be displayed.'],
  ['Connected identities', 'Optional Google, Telegram, email or phone verification may be used for sign-in, security or recovery. Reusable provider credentials are kept server-side and are not intentionally exposed to public pages.'],
  ['Information processed', 'Depending on the feature you use, Otya may process account details, verified contact information, linked identities, device/app version information, installation identifiers, update telemetry, AI conversation data, feedback, diagnostics, support messages and online music searches.'],
  ['AI and support', 'Guest AI chats are intended to be temporary. Signed-in conversations may be stored when needed to restore them to that account. Customer AI does not receive access to private administrator tools.'],
  ['How information is used', 'Information is used to provide and secure Otya, return requested content, synchronize optional account features, deliver updates, diagnose failures, prevent abuse and answer support requests. Otya does not sell personal information.'],
  ['Infrastructure and providers', 'Otya may use Cloudflare, Resend, Firebase, Google, Telegram and music providers for specific features. Those providers may process information under their own terms when you choose to use the relevant integration.'],
  ['Your choices', 'You may avoid online music, Ask Otya or provider linking and continue using supported local playback features. You may request access, correction or deletion of personal information associated with your Otya account, subject to applicable law and security requirements.'],
  ['Contact', 'For privacy questions or requests, email support@petersmartlink.com.'],
]

export default function PrivacyPage() {
  return <div className="min-h-screen flex flex-col otya-ambient" style={{ color: 'var(--cosmos-text-primary)' }}>
    <SiteNav />
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <header className="mb-7">
        <div className="otya-kicker mb-2">Otya · Privacy</div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[-.04em]">Privacy without the wall of text.</h1>
        <p className="mt-2 text-sm otya-muted">Last updated August 30, 2026. Open only the section you need.</p>
      </header>
      <section className="overflow-hidden rounded-[24px] border backdrop-blur-xl" style={{ borderColor:'var(--cosmos-divider)', background:'color-mix(in srgb,var(--cosmos-card) 82%,transparent)' }}>
        {SECTIONS.map(([title, body]) => <details key={title} className="group border-b last:border-b-0" style={{ borderColor:'var(--cosmos-divider)' }}>
          <summary className="cursor-pointer list-none px-4 sm:px-5 py-4 flex items-center justify-between gap-4 font-bold text-sm"><span>{title}</span><span className="text-lg otya-muted group-open:rotate-45 transition-transform">＋</span></summary>
          <p className="px-4 sm:px-5 pb-5 text-sm leading-7 otya-muted">{body}</p>
        </details>)}
      </section>
      <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold"><Link href="/terms">Terms</Link><Link href="/help">Help</Link></div>
    </main>
    <SiteFooter />
  </div>
}
