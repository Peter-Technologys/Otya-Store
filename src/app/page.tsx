import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'OTYA — Music first. Player everywhere.',
  description: 'Discover and play music online, then take OTYA with you for private offline-first video and music playback on Android.',
  alternates: { canonical: 'https://petersmartlink.com' },
}

const DISCOVERY = [
  ['Ugandan Music', 'uganda'],
  ['New Music', 'new music'],
  ['Afrobeats', 'afrobeats'],
  ['Gospel', 'gospel'],
  ['R&B', 'rnb'],
  ['International', 'pop'],
]

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
      <SiteNav />
      <main className="flex-1">
        <section className="otya-shell pt-10 sm:pt-16 pb-8 sm:pb-12">
          <div className="max-w-4xl">
            <div className="otya-kicker mb-3">OTYA Music</div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-[-.055em] leading-[.95]">Find something worth playing.</h1>
            <p className="mt-4 text-base sm:text-lg otya-muted max-w-2xl">Search music, discover new artists and play from supported providers in one clean OTYA experience.</p>

            <form action="/music" className="mt-7 max-w-3xl flex gap-2">
              <input name="q" placeholder="Search songs, artists or albums" aria-label="Search music" className="min-h-14 min-w-0 flex-1 rounded-2xl border px-5 outline-none text-base" style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)', color: 'var(--cosmos-text-primary)' }} />
              <button className="cosmos-button min-h-14 rounded-2xl px-5 sm:px-7 font-bold">Search</button>
            </form>
          </div>
        </section>

        <section className="otya-shell pb-10 sm:pb-14">
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <div className="otya-kicker mb-1">Explore</div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-[-.035em]">Start with a sound</h2>
            </div>
            <Link href="/music" className="text-sm font-semibold otya-muted">Open player →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {DISCOVERY.map(([label, query], index) => (
              <Link key={label} href={`/music?q=${encodeURIComponent(query)}`} className="group min-h-32 rounded-2xl border p-4 flex items-end overflow-hidden" style={{ borderColor: 'var(--cosmos-divider)', background: `linear-gradient(145deg, color-mix(in srgb, var(--cosmos-primary) ${12 + index * 2}%, var(--cosmos-card)), var(--cosmos-card))` }}>
                <span className="font-black tracking-[-.025em] leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-y" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-surface)' }}>
          <div className="otya-shell py-10 sm:py-14 grid lg:grid-cols-[1fr_.8fr] gap-7 lg:gap-14 items-center">
            <div>
              <div className="otya-kicker mb-2">Take OTYA with you</div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-[-.04em]">Your own music and videos stay yours.</h2>
              <p className="mt-3 otya-muted max-w-2xl">The Android app plays your local library offline, handles video, Transfer and Private media, and does not require an account just to play your files.</p>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-stretch">
              <Link href="/download/otya-player" className="cosmos-button rounded-xl px-5 py-3 text-sm font-bold text-center">Get OTYA for Android</Link>
              <Link href="/otya-player" className="otya-quiet-button rounded-xl px-5 py-3 text-sm font-bold text-center">See the player</Link>
            </div>
          </div>
        </section>

        <section className="otya-shell py-10 sm:py-14">
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/ask" className="rounded-2xl border p-5 sm:p-6" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-card)' }}>
              <div className="text-lg font-black">Ask OTYA</div>
              <div className="mt-1 text-sm otya-muted">Help with OTYA, music discovery and common questions.</div>
            </Link>
            <Link href="/account" className="rounded-2xl border p-5 sm:p-6" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-card)' }}>
              <div className="text-lg font-black">Your account</div>
              <div className="mt-1 text-sm otya-muted">Sign in only when you need account-connected features.</div>
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
