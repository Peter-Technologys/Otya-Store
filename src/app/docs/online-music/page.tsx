import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata = {
  title: 'Online Music | OTYA Docs',
  description: 'How OTYA online music works across Android, web and Telegram while keeping local playback first.',
  alternates: { canonical: 'https://petersmartlink.com/docs/online-music' },
}

const sections = [
  ['What it is', 'Online Music is an optional discovery and playback layer inside OTYA. Your local library stays primary and continues to work without internet, sign-in, Firebase, Jamendo or Ask OTYA.'],
  ['On Android', 'Search shows local results first. When the onlineMusic feature is enabled and a provider is reachable, matching online tracks may appear underneath local results and use the normal OTYA player/queue experience.'],
  ['On the website', 'The OTYA Music page provides one search bar, a compact result list and one Now Playing area. Tracks are streamed from the provider; OTYA shows creator/provider attribution and a source link.'],
  ['On Telegram', 'Telegram stays lightweight. Users can use the music command to discover OTYA Music and search from the web surface. Telegram is not used as an unrestricted music-file mirror.'],
  ['Downloads', 'A Download action is shown only when the provider explicitly reports that downloading that track is allowed and supplies a valid download URL. Otherwise no Download action is shown. Downloaded media becomes normal local music after Android media indexing.'],
  ['Accounts', 'An OTYA account is not required for ordinary local playback. A Jamendo account is not required for the public catalog. Optional provider account linking is separate and requires explicit consent.'],
  ['Rights and attribution', 'Online tracks remain owned or licensed by their creators and providers. OTYA must preserve the creator name, provider credit, source link and applicable license information. Provider terms can also limit commercial use, caching or offline access.'],
  ['When online services fail', 'Online sections should disappear or show a small retry state without replacing local results. Provider, Cloudflare, Firebase or AI outages must never make local Music or Video look broken.'],
]

export default function OnlineMusicDocsPage() {
  return <div className="min-h-screen flex flex-col" style={{background:'var(--cosmos-scaffold)',color:'var(--cosmos-text-primary)'}}>
    <SiteNav />
    <main className="flex-1">
      <div className="otya-shell py-12 sm:py-16 max-w-3xl">
        <div className="otya-kicker mb-3">Docs · Music</div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-[-.04em]">Online Music</h1>
        <p className="mt-3 text-sm sm:text-base otya-muted max-w-2xl">One feature across Android, web and Telegram, with the same rules everywhere.</p>

        <div className="mt-8 border-y" style={{borderColor:'var(--cosmos-divider)'}}>
          {sections.map(([title, body], index) => <section key={title} className={`py-5 ${index < sections.length - 1 ? 'border-b' : ''}`} style={{borderColor:'var(--cosmos-divider)'}}>
            <h2 className="font-bold">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed otya-muted">{body}</p>
          </section>)}
        </div>

        <div className="mt-7 flex flex-wrap gap-4 text-sm font-semibold">
          <Link href="/music">Open OTYA Music →</Link>
          <Link href="/terms">Terms →</Link>
          <Link href="/privacy">Privacy →</Link>
          <Link href="/docs">All Docs →</Link>
        </div>
      </div>
    </main>
    <SiteFooter />
  </div>
}
