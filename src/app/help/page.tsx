import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Help | Otya',
  description: 'Otya help, account recovery, security and support in one place.',
  alternates: { canonical: 'https://petersmartlink.com/help' },
}

const quickHelp = [
  ['I cannot sign in', 'Use Sign in for Google, Telegram or email. Password recovery is on the same screen. If Google does not load, refresh once after the page update and make sure your browser is not blocking accounts.google.com.'],
  ['I am not receiving an account email', 'Check spam and promotions, confirm the address, then request a fresh code. New requests make older codes obsolete.'],
  ['Music or videos are missing in the Android app', 'Allow the media permissions requested by Android, then rescan your local library.'],
  ['Playback stops in the background', 'Allow Otya notifications and check Android battery restrictions for the app.'],
  ['Transfer is not connecting', 'Keep both phones nearby, enable Wi-Fi or hotspot, and start Transfer from Me. Nearby transfer does not require mobile data.'],
  ['How does Private work?', 'Private keeps supported local media inside Otya app-private storage until you restore it. Keep a separate backup of important files.'],
  ['Security and safe downloads', 'Install Otya only from the official Get Otya page. Never send passwords, OTPs, recovery codes, API keys or secret tokens to anyone claiming to be support.'],
]

export default function HelpPage() {
  return <div className="min-h-screen flex flex-col otya-ambient" style={{color:'var(--cosmos-text-primary)'}}>
    <SiteNav />
    <main className="flex-1 pb-24 md:pb-0">
      <section className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <header className="mb-6">
          <div className="otya-kicker mb-2">Help</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[-.045em]">Get unstuck quickly.</h1>
          <p className="mt-2 text-sm otya-muted">One help page. Short answers. Ask Otya when you need a conversation.</p>
        </header>

        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          <Link href="/ask" className="modern-card p-4 min-h-24 flex flex-col justify-between"><span className="text-xl">✦</span><span><strong className="block text-sm">Ask Otya</strong><span className="text-xs otya-muted">Open the assistant</span></span></Link>
          <Link href="/sign-in" className="modern-card p-4 min-h-24 flex flex-col justify-between"><span className="text-xl">◉</span><span><strong className="block text-sm">Account help</strong><span className="text-xs otya-muted">Sign in or recover access</span></span></Link>
        </div>

        <section className="overflow-hidden rounded-[24px] border backdrop-blur-xl" aria-labelledby="quick-help" style={{borderColor:'var(--cosmos-divider)',background:'color-mix(in srgb,var(--cosmos-card) 82%,transparent)'}}>
          <h2 id="quick-help" className="sr-only">Quick help</h2>
          {quickHelp.map(([title,text])=><details key={title} id={title.startsWith('Security')?'security':undefined} className="group border-b last:border-b-0" style={{borderColor:'var(--cosmos-divider)'}}><summary className="cursor-pointer list-none px-4 sm:px-5 py-4 flex items-center justify-between gap-4 font-bold text-sm"><span>{title}</span><span className="otya-muted group-open:rotate-45 transition-transform">＋</span></summary><p className="px-4 sm:px-5 pb-5 text-sm leading-7 otya-muted">{text}</p></details>)}
        </section>

        <section id="contact" className="mt-7" aria-labelledby="contact-title">
          <h2 id="contact-title" className="text-lg font-extrabold mb-3">Contact Otya</h2>
          <div className="grid grid-cols-2 gap-3">
            <a href="https://t.me/OtyaPlayerBot" target="_blank" rel="noopener noreferrer" className="modern-card p-4 min-h-20 flex items-center gap-3"><span className="text-xl">➤</span><span className="font-bold text-sm">Telegram</span></a>
            <a href="mailto:support@petersmartlink.com?subject=Otya%20Support" className="modern-card p-4 min-h-20 flex items-center gap-3"><span className="text-xl">✉</span><span className="font-bold text-sm">Email</span></a>
          </div>
        </section>

        <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-sm font-bold"><Link href="/download/otya-player">Get Otya</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
      </section>
    </main>
    <SiteFooter />
  </div>
}
