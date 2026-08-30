import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { OtyaAssistPrompt } from '@/components/OtyaAssistPrompt'

export const metadata: Metadata = {
  title: 'Help | OTYA',
  description: 'OTYA help, account recovery, support, security and official contact options in one place.',
  alternates: { canonical: 'https://petersmartlink.com/help' },
}

const quickHelp = [
  ['Music or videos are missing', 'Allow the media permissions requested by Android, then rescan your library. Audio and video permissions are separate on newer Android versions.'],
  ['Playback stops in the background', 'Allow OTYA notifications and check that Android battery restrictions are not forcing OTYA to stop.'],
  ['I cannot sign in', 'Use Sign in for Google, Telegram or email. If email login fails, use password recovery. Telegram sign-in works after that Telegram identity has been linked to an OTYA account.'],
  ['Transfer is not connecting', 'Keep both phones nearby, enable Wi-Fi or hotspot, and start Transfer from Me. The file transfer itself does not require mobile data.'],
]

export default function HelpPage() {
  return <div className="min-h-screen flex flex-col" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
    <SiteNav />
    <main className="flex-1">
      <section className="otya-shell py-10 sm:py-14">
        <header className="max-w-2xl">
          <div className="otya-kicker mb-3">Help</div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-[-.045em]">Find the answer. Keep moving.</h1>
          <p className="mt-3 text-sm sm:text-base otya-muted">Ask OTYA first, use a quick fix, or contact the official support channels. Everything important is here.</p>
        </header>

        <div className="mt-7 max-w-3xl"><OtyaAssistPrompt /></div>

        <section className="mt-9" aria-labelledby="quick-help">
          <div className="flex items-end justify-between gap-4 mb-3">
            <h2 id="quick-help" className="text-xl font-black">Quick help</h2>
            <Link href="/sign-in" className="text-sm font-semibold otya-muted">Sign in →</Link>
          </div>
          <div className="border-y" style={{ borderColor: 'var(--cosmos-divider)' }}>
            {quickHelp.map(([title, text]) => <details key={title} className="group border-b last:border-b-0" style={{ borderColor: 'var(--cosmos-divider)' }}>
              <summary className="cursor-pointer list-none py-4 flex items-center justify-between gap-4 font-semibold text-sm">
                <span>{title}</span><span className="otya-muted group-open:rotate-45 transition-transform">＋</span>
              </summary>
              <p className="pb-4 pr-8 text-sm leading-relaxed otya-muted">{text}</p>
            </details>)}
          </div>
        </section>

        <section id="contact" className="mt-10 scroll-mt-24" aria-labelledby="contact-title">
          <h2 id="contact-title" className="text-xl font-black mb-3">Contact OTYA</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <a href="https://t.me/OtyaPlayerBot" target="_blank" rel="noopener noreferrer" className="modern-card p-4 min-h-24 flex flex-col justify-between">
              <span className="text-xl">➤</span><span className="font-bold text-sm">Telegram support</span>
            </a>
            <a href="mailto:support@petersmartlink.com?subject=OTYA%20Support" className="modern-card p-4 min-h-24 flex flex-col justify-between">
              <span className="text-xl">✉</span><span className="font-bold text-sm">Email support</span>
            </a>
            <Link href="/ask" className="modern-card p-4 min-h-24 flex flex-col justify-between">
              <span className="text-xl">O</span><span className="font-bold text-sm">Ask OTYA</span>
            </Link>
          </div>
        </section>

        <section className="mt-10 border-t pt-6" style={{ borderColor: 'var(--cosmos-divider)' }}>
          <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold">
            <Link href="/download/otya-player">Get OTYA</Link>
            <Link href="/account">Account & security</Link>
            <Link href="/apps/otya-player/security">Security guide</Link>
            <Link href="/apps/otya-player/changelog">What changed</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </section>
      </section>
    </main>
    <SiteFooter />
  </div>
}
