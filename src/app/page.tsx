import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Otya — Music first. Player everywhere.',
  description: 'Discover and play music online, then take Otya with you for offline-first music and video playback on Android.',
  alternates: { canonical: 'https://petersmartlink.com' },
}

const DISCOVERY = [
  ['Ugandan Music', 'uganda', 'Made close to home'],
  ['New Music', 'new music', 'Fresh finds'],
  ['Afrobeats', 'afrobeats', 'Energy across Africa'],
  ['Gospel', 'gospel', 'Voices and praise'],
  ['R&B', 'rnb', 'Slow, warm, soulful'],
  ['International', 'pop', 'Beyond borders'],
]

export default function HomePage() {
  return <div className="min-h-screen flex flex-col otya-ambient" style={{ color: 'var(--cosmos-text-primary)' }}>
    <SiteNav />
    <main className="flex-1 pb-24 md:pb-0">
      <section className="otya-shell pt-10 sm:pt-16 pb-8 sm:pb-12">
        <div className="max-w-4xl">
          <div className="otya-kicker mb-3">Otya Music</div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-[-.06em] leading-[.94]">Find something<br className="hidden sm:block"/> worth playing.</h1>
          <p className="mt-4 text-base sm:text-lg otya-muted max-w-xl">Search music, discover artists and play from supported sources without leaving Otya.</p>
          <form action="/music" className="mt-7 max-w-3xl flex gap-2 rounded-[22px] p-1.5 border backdrop-blur-xl" style={{ background: 'color-mix(in srgb,var(--cosmos-card) 72%,transparent)', borderColor: 'color-mix(in srgb,var(--cosmos-divider) 78%,transparent)' }}>
            <input name="q" placeholder="Search songs, artists or albums" aria-label="Search music" className="min-h-12 min-w-0 flex-1 rounded-2xl px-4 outline-none text-base bg-transparent" style={{ color: 'var(--cosmos-text-primary)' }} />
            <button className="cosmos-button min-h-12 rounded-2xl px-5 sm:px-7 font-extrabold">Search</button>
          </form>
        </div>
      </section>

      <section className="pb-11 sm:pb-14">
        <div className="otya-shell flex items-end justify-between gap-4 mb-4">
          <div><div className="otya-kicker mb-1">Otya Pulse</div><h2 className="text-2xl sm:text-3xl font-extrabold">Start with a sound</h2></div>
          <Link href="/music" className="text-sm font-bold otya-muted shrink-0">All music →</Link>
        </div>
        <div className="overflow-x-auto overscroll-x-contain snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-3 px-[max(12px,calc((100vw-min(1120px,calc(100vw-32px)))/2))] sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:w-[min(1120px,calc(100%-32px))] sm:mx-auto sm:px-0">
            {DISCOVERY.map(([label, query, note], index) => <Link key={label} href={`/music?q=${encodeURIComponent(query)}`} className="group relative w-[68vw] max-w-[250px] sm:w-auto sm:max-w-none aspect-[1.12/1] sm:aspect-[.92/1] shrink-0 snap-start rounded-[24px] border p-4 flex flex-col justify-between overflow-hidden transition-transform hover:-translate-y-1" style={{ borderColor: 'color-mix(in srgb,var(--cosmos-divider) 80%,transparent)', background: `radial-gradient(circle at ${18 + index * 10}% 18%, color-mix(in srgb, var(--cosmos-primary) ${24 + index * 2}%, transparent), transparent 45%), radial-gradient(circle at 90% 85%, color-mix(in srgb,var(--cosmos-cyan) ${8 + index}%,transparent),transparent 42%), var(--cosmos-card)` }}>
              <span className="text-[10px] uppercase tracking-[.14em] font-extrabold otya-muted">{note}</span>
              <span className="font-extrabold text-xl sm:text-lg tracking-[-.04em] leading-tight">{label}</span>
            </Link>)}
          </div>
        </div>
      </section>

      <section className="border-y" style={{ borderColor: 'var(--cosmos-divider)', background: 'linear-gradient(110deg,color-mix(in srgb,var(--cosmos-primary) 8%,var(--cosmos-surface)),color-mix(in srgb,var(--cosmos-cyan) 7%,var(--cosmos-surface)))' }}>
        <div className="otya-shell py-10 sm:py-14 grid lg:grid-cols-[1fr_.7fr] gap-8 lg:gap-14 items-center">
          <div><div className="otya-kicker mb-2">Take Otya with you</div><h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-.045em]">Your own music and videos stay yours.</h2><p className="mt-3 otya-muted max-w-2xl">Otya Player works offline with your local library, video, Transfer and Private. Signing in is optional for local playback.</p></div>
          <div className="grid gap-3">
            <Link href="/download/otya-player" className="cosmos-button rounded-full px-5 py-3.5 text-sm font-extrabold text-center">Get Otya for Android</Link>
            <Link href="/otya-player" className="otya-quiet-button rounded-full px-5 py-3.5 text-sm font-bold text-center">Explore Otya Player</Link>
          </div>
        </div>
      </section>

      <section className="otya-shell py-10 sm:py-14">
        <div className="grid sm:grid-cols-2 gap-3">
          <Link href="/ask" className="modern-card p-5 sm:p-6"><div className="otya-kicker mb-5">Assistant</div><div className="text-xl font-extrabold">Ask Otya</div><div className="mt-1 text-sm otya-muted">Get help or discover music without digging through pages.</div></Link>
          <Link href="/sign-in" className="modern-card p-5 sm:p-6"><div className="otya-kicker mb-5">Account</div><div className="text-xl font-extrabold">Your Otya</div><div className="mt-1 text-sm otya-muted">Security, recovery and connected features in one place.</div></Link>
        </div>
      </section>
    </main>
    <SiteFooter />
  </div>
}
