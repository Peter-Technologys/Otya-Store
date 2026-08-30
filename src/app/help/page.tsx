import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { OtyaAssistPrompt } from '@/components/OtyaAssistPrompt'

export const metadata: Metadata = {
  title: 'Help | Otya',
  description: 'Otya help, account recovery and official support in one place.',
  alternates: { canonical: 'https://petersmartlink.com/help' },
}

const quickHelp = [
  ['Music or videos are missing', 'Allow the media permissions requested by Android, then rescan your library. Audio and video permissions are separate on newer Android versions.'],
  ['Playback stops in the background', 'Allow Otya notifications and check that Android battery restrictions are not forcing the app to stop.'],
  ['I cannot sign in', 'Open Sign in for Google, Telegram or email. If you forgot your password, use recovery on the same screen. Telegram sign-in works after that Telegram identity has been linked to your Otya account.'],
  ['I am not receiving an account email', 'Check spam and promotions, confirm the address is correct, then request a fresh code. Otya codes expire and older codes stop being useful after a new request.'],
  ['Transfer is not connecting', 'Keep both phones nearby, enable Wi-Fi or hotspot, and start Transfer from Me. The file transfer itself does not require mobile data.'],
  ['How does Private work?', 'Private keeps supported local media inside Otya app-private storage until you restore it. Keep a separate backup of important files.'],
]

export default function HelpPage() {
  return <div className="min-h-screen flex flex-col otya-ambient" style={{color:'var(--cosmos-text-primary)'}}>
    <SiteNav />
    <main className="flex-1 pb-24 md:pb-0">
      <section className="otya-shell py-10 sm:py-14">
        <header className="max-w-2xl">
          <div className="otya-kicker mb-3">Help</div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-[-.05em]">Find the answer. Keep moving.</h1>
          <p className="mt-3 text-sm sm:text-base otya-muted">Ask Otya, open a quick fix, or contact support. No maze of documentation pages.</p>
        </header>

        <div className="mt-7 max-w-3xl"><OtyaAssistPrompt /></div>

        <section className="mt-9 modern-card p-4 sm:p-5" aria-labelledby="quick-help">
          <div className="flex items-end justify-between gap-4 mb-2"><h2 id="quick-help" className="text-xl font-extrabold">Quick help</h2><Link href="/sign-in" className="text-sm font-bold otya-muted">Sign in →</Link></div>
          <div>{quickHelp.map(([title,text])=><details key={title} className="group border-b last:border-b-0" style={{borderColor:'var(--cosmos-divider)'}}><summary className="cursor-pointer list-none py-4 flex items-center justify-between gap-4 font-bold text-sm"><span>{title}</span><span className="otya-muted group-open:rotate-45 transition-transform">＋</span></summary><p className="pb-4 pr-8 text-sm leading-relaxed otya-muted">{text}</p></details>)}</div>
        </section>

        <section id="contact" className="mt-9" aria-labelledby="contact-title">
          <div className="otya-kicker mb-2">Official channels</div><h2 id="contact-title" className="text-xl font-extrabold mb-3">Contact Otya</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <a href="https://t.me/OtyaPlayerBot" target="_blank" rel="noopener noreferrer" className="modern-card p-4 min-h-28 flex flex-col justify-between"><span className="text-2xl">➤</span><span className="font-extrabold text-sm">Telegram</span></a>
            <a href="mailto:support@petersmartlink.com?subject=Otya%20Support" className="modern-card p-4 min-h-28 flex flex-col justify-between"><span className="text-2xl">✉</span><span className="font-extrabold text-sm">Email</span></a>
            <Link href="/ask" className="modern-card p-4 min-h-28 flex flex-col justify-between"><span className="text-2xl">✦</span><span className="font-extrabold text-sm">Ask Otya</span></Link>
          </div>
        </section>

        <section className="mt-9 border-t pt-5" style={{borderColor:'var(--cosmos-divider)'}}><div className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-bold"><Link href="/download/otya-player">Get Otya</Link><Link href="/account">Account</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div></section>
      </section>
    </main>
    <SiteFooter />
  </div>
}
