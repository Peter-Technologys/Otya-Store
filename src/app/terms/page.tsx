import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Terms | Otya',
  description: 'Terms for using Otya accounts, AI, online music and connected services.',
  alternates: { canonical: 'https://petersmartlink.com/terms' },
}

const SECTIONS = [
  ['Acceptance', 'By accessing or using Otya websites, accounts, applications or connected services, you agree to these Terms and applicable product-specific policies.'],
  ['Otya account', 'One Otya account may be used across connected Otya services. Product-specific data and permissions remain separately scoped. Core local Otya Player playback does not require an account.'],
  ['Verification and sign-in', 'Otya may offer email, Google, Telegram, phone or other approved verification methods for sign-in, security and recovery. Third-party providers may apply their own terms to those integrations.'],
  ['Services', 'Otya includes Otya Player, website music, Ask Otya, downloads, support, account services and other official Otya features made available through approved channels.'],
  ['Online music', 'Online music may display or stream tracks supplied by third-party providers. Those tracks remain subject to the creator’s license and provider terms. Otya does not claim ownership of third-party music.'],
  ['Downloads', 'A music download action is offered only when the provider reports that downloading the selected track is permitted and supplies a valid download source. Users remain responsible for respecting the relevant license and provider terms.'],
  ['AI features', 'Ask Otya may generate incorrect or incomplete information. Verify important information independently. Customer AI does not receive access to private administrator systems.'],
  ['Prohibited use', 'Do not use Otya for fraud, abuse, unauthorized access, unlawful distribution, copyright infringement, circumvention of provider restrictions, interference with service operation or attempts to obtain secrets.'],
  ['Software and updates', 'Features, availability and requirements may change over time. Updates may improve security, compatibility, performance and functionality.'],
  ['Third-party services', 'Optional features may interact with services such as Google, Telegram, Firebase, Resend, Cloudflare and music providers. Their terms and privacy practices may apply when you use those integrations.'],
  ['Liability', 'To the extent permitted by applicable law, Otya is not responsible for indirect, incidental or consequential losses resulting from use of the services or from third-party content or provider availability.'],
  ['Governing law', 'These terms are governed by the applicable laws of the Republic of Uganda.'],
  ['Contact', 'Questions about these terms can be sent to support@petersmartlink.com.'],
]

export default function TermsPage() {
  return <div className="min-h-screen flex flex-col otya-ambient" style={{ color: 'var(--cosmos-text-primary)' }}>
    <SiteNav />
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <header className="mb-7">
        <div className="otya-kicker mb-2">Otya · Terms</div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[-.04em]">Clear terms. Less scrolling.</h1>
        <p className="mt-2 text-sm otya-muted">Last updated August 30, 2026. Expand only what you want to read.</p>
      </header>
      <section className="overflow-hidden rounded-[24px] border backdrop-blur-xl" style={{ borderColor:'var(--cosmos-divider)', background:'color-mix(in srgb,var(--cosmos-card) 82%,transparent)' }}>
        {SECTIONS.map(([title, body]) => <details key={title} className="group border-b last:border-b-0" style={{ borderColor:'var(--cosmos-divider)' }}>
          <summary className="cursor-pointer list-none px-4 sm:px-5 py-4 flex items-center justify-between gap-4 font-bold text-sm"><span>{title}</span><span className="text-lg otya-muted group-open:rotate-45 transition-transform">＋</span></summary>
          <p className="px-4 sm:px-5 pb-5 text-sm leading-7 otya-muted">{body}</p>
        </details>)}
      </section>
      <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold"><Link href="/privacy">Privacy</Link><Link href="/help">Help</Link></div>
    </main>
    <SiteFooter />
  </div>
}
