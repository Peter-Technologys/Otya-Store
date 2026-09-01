import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Help | OTYA',
  description: 'Quick help for OTYA music, accounts, transfer and Android playback.',
  alternates: { canonical: 'https://petersmartlink.com/help' },
}

const quickHelp = [
  ['I cannot sign in', 'Use Google or email on the Sign in page. If Google does not load, try again after refreshing the page. Telegram sign-in is not shown until its service is configured and verified.'],
  ['I did not receive a reset or verification email', 'Request one fresh code and check spam or promotions. If nothing arrives, contact OTYA Support instead of repeatedly requesting codes.'],
  ['Music or videos are missing in the Android app', 'Allow the media permissions requested by Android, then rescan your local library.'],
  ['Playback stops in the background', 'Allow OTYA notifications and check Android battery restrictions for the app.'],
  ['Transfer is not connecting', 'Keep both phones nearby, enable Wi-Fi or hotspot, and start Transfer from Me. Nearby transfer does not require mobile data.'],
  ['How does Private work?', 'Private keeps supported local media inside OTYA app-private storage until you restore it. Keep a separate backup of important files.'],
  ['Security and safe downloads', 'Install OTYA only from the official download page. Never share passwords, OTPs, recovery codes, API keys or secret tokens.'],
]

export default function HelpPage() {
  return <div className="min-h-screen flex flex-col bg-[color:var(--cosmos-scaffold)] text-[color:var(--cosmos-text-primary)]">
    <SiteNav />
    <main className="flex-1">
      <section className="otya-reading py-10 sm:py-14">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-5xl font-black tracking-[-.055em]">How can we help?</h1>
          <p className="mt-3 text-sm sm:text-base leading-6 otya-muted">Quick answers first. Open Next when you want a conversation.</p>
        </header>

        <div className="grid sm:grid-cols-2 gap-3 mb-7">
          <Link href="/ask" className="rounded-[24px] border border-black/[.06] dark:border-white/[.08] bg-white/75 dark:bg-white/[.025] p-5 min-h-28 flex flex-col justify-between"><span className="w-10 h-10 rounded-2xl grid place-items-center bg-[linear-gradient(145deg,#7b67ff,#48bde2)] text-white font-black">N</span><span><strong className="block text-base">Next</strong><span className="text-xs otya-muted">Describe the problem or question in your own words</span></span></Link>
          <Link href="/sign-in" className="rounded-[24px] border border-black/[.06] dark:border-white/[.08] bg-white/75 dark:bg-white/[.025] p-5 min-h-28 flex flex-col justify-between"><span className="w-10 h-10 rounded-2xl grid place-items-center bg-black/[.05] dark:bg-white/[.07] font-black">↗</span><span><strong className="block text-base">OTYA Account</strong><span className="text-xs otya-muted">Sign in, create an account or recover access</span></span></Link>
        </div>

        <section className="overflow-hidden rounded-[24px] border border-black/[.06] dark:border-white/[.08] bg-white/70 dark:bg-white/[.02]" aria-labelledby="quick-help">
          <h2 id="quick-help" className="sr-only">Quick help</h2>
          {quickHelp.map(([title,text])=><details key={title} id={title.startsWith('Security')?'security':undefined} className="group border-b border-black/[.05] dark:border-white/[.07] last:border-b-0"><summary className="cursor-pointer list-none px-4 sm:px-5 py-4 flex items-center justify-between gap-4 font-black text-sm"><span>{title}</span><span className="otya-muted group-open:rotate-45 transition-transform">＋</span></summary><p className="px-4 sm:px-5 pb-5 text-sm leading-7 otya-muted">{text}</p></details>)}
        </section>

        <section id="contact" className="mt-9" aria-labelledby="contact-title">
          <div className="flex items-end justify-between gap-4 mb-3"><h2 id="contact-title" className="text-xl font-black">Contact OTYA</h2><span className="text-xs otya-muted">Human support</span></div>
          <div className="grid grid-cols-2 gap-3">
            <a href="https://t.me/OtyaPlayerBot" target="_blank" rel="noopener noreferrer" className="rounded-[20px] border border-black/[.06] dark:border-white/[.08] bg-white/70 dark:bg-white/[.025] p-4 min-h-20 flex items-center gap-3"><span className="w-9 h-9 rounded-full grid place-items-center bg-[#229ED9]/10 text-[#229ED9] font-black">➤</span><span className="font-black text-sm">Telegram</span></a>
            <a href="mailto:support@petersmartlink.com?subject=OTYA%20Support" className="rounded-[20px] border border-black/[.06] dark:border-white/[.08] bg-white/70 dark:bg-white/[.025] p-4 min-h-20 flex items-center gap-3"><span className="w-9 h-9 rounded-full grid place-items-center bg-black/[.045] dark:bg-white/[.06] font-black">✉</span><span className="font-black text-sm">Email</span></a>
          </div>
        </section>
      </section>
    </main>
    <SiteFooter />
  </div>
}
