import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Otya — Music on the web. Your media on Android.',
  description: 'Discover music online with Otya, ask for help naturally, and get Otya Player for offline-first local music and video on Android.',
  alternates: { canonical: 'https://petersmartlink.com' },
}

const MOODS = [
  ['Uganda right now', 'uganda', 'UG'],
  ['Afrobeats', 'afrobeats', 'AF'],
  ['New releases', 'new music', 'NEW'],
  ['Gospel', 'gospel', 'GOS'],
  ['R&B', 'rnb', 'R&B'],
  ['Global pop', 'pop', 'POP'],
]

export default function HomePage() {
  return <div className="min-h-screen flex flex-col otya-ambient">
    <SiteNav />
    <main className="flex-1">
      <section className="otya-shell pt-9 sm:pt-14 lg:pt-16 pb-12 sm:pb-16">
        <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-8 lg:gap-14 items-center">
          <div className="max-w-[670px]">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-extrabold otya-muted bg-white/55 dark:bg-white/[.035] border-black/[.06] dark:border-white/[.08]">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Music is ready
            </div>
            <h1 className="mt-5 text-[clamp(43px,7vw,78px)] font-black tracking-[-.065em] leading-[.92] max-w-[720px]">What do you want to hear?</h1>
            <p className="mt-5 text-base sm:text-lg leading-7 otya-muted max-w-[590px]">Search, discover and play music without learning a complicated website.</p>

            <form action="/music" className="mt-7 max-w-[690px] rounded-[24px] p-1.5 otya-glass shadow-[0_18px_60px_rgba(28,21,55,.08)] flex items-center gap-2">
              <span className="pl-3 text-lg opacity-55" aria-hidden="true">⌕</span>
              <input name="q" placeholder="Song, artist, album or mood" aria-label="Search music" className="min-h-12 min-w-0 flex-1 rounded-2xl px-2 outline-none bg-transparent text-[15px]" />
              <button className="cosmos-button min-h-12 rounded-[18px] px-5 sm:px-7 font-black">Search</button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {['Uganda','Afrobeats','Gospel','New music'].map(label => <Link key={label} href={`/music?q=${encodeURIComponent(label)}`} className="rounded-full border px-3 py-1.5 text-[12px] font-bold otya-muted bg-white/50 dark:bg-white/[.025] border-black/[.06] dark:border-white/[.08]">{label}</Link>)}
            </div>
          </div>

          <div className="relative min-h-[370px] sm:min-h-[430px] lg:min-h-[500px]">
            <div className="absolute inset-0 rounded-[38px] overflow-hidden border border-black/[.06] dark:border-white/[.08] bg-[linear-gradient(145deg,#171326,#24205a_48%,#132d3a)] shadow-[0_30px_90px_rgba(14,10,30,.25)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(188,119,255,.42),transparent_28%),radial-gradient(circle_at_80%_22%,rgba(75,194,255,.30),transparent_27%),radial-gradient(circle_at_50%_95%,rgba(229,102,181,.28),transparent_30%)]" />
              <div className="absolute inset-x-5 top-5 flex items-center justify-between text-white/70 text-[11px] font-bold"><span>Otya Music</span><span>Now playing</span></div>
              <div className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 w-[190px] sm:w-[230px] aspect-square rounded-[34px] bg-[linear-gradient(145deg,#f0b4ff,#8272ff_48%,#4bc0dc)] shadow-[0_28px_70px_rgba(0,0,0,.35)] grid place-items-center">
                <div className="w-[72%] h-[72%] rounded-full bg-black/75 grid place-items-center shadow-inner"><div className="w-[28%] h-[28%] rounded-full bg-white/85" /></div>
              </div>
              <div className="absolute inset-x-6 bottom-7 text-white">
                <div className="text-[11px] uppercase tracking-[.14em] font-black text-white/50">A sound for right now</div>
                <div className="mt-2 text-2xl sm:text-3xl font-black tracking-[-.045em]">Press play. Keep moving.</div>
                <div className="mt-5 h-1 rounded-full bg-white/15 overflow-hidden"><div className="h-full w-[58%] bg-white rounded-full" /></div>
                <div className="mt-4 flex items-center justify-between"><span className="text-xs text-white/55">Otya discovery</span><span className="grid place-items-center w-12 h-12 rounded-full bg-white text-black font-black text-sm">▶</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="otya-shell pb-14 sm:pb-18">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div><h2 className="text-2xl sm:text-3xl font-black">Start somewhere</h2><p className="mt-1 text-sm otya-muted">A few easy ways into the catalogue.</p></div>
          <Link href="/music" className="text-sm font-black">See all</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {MOODS.map(([label,query,short]) => <Link key={label} href={`/music?q=${encodeURIComponent(query)}`} className="group min-h-[150px] sm:min-h-[180px] rounded-[24px] p-4 flex flex-col justify-between overflow-hidden border border-black/[.055] dark:border-white/[.07] shadow-sm" style={{background:`linear-gradient(145deg,color-mix(in srgb,var(--cosmos-card) 88%,var(--cosmos-primary)),color-mix(in srgb,var(--cosmos-card) 94%,var(--cosmos-cyan)))`}}>
            <span className="w-11 h-11 rounded-2xl grid place-items-center text-[11px] font-black bg-black/[.055] dark:bg-white/[.08]">{short}</span>
            <div><div className="font-black text-[17px] leading-tight">{label}</div><div className="mt-1 text-xs otya-muted group-hover:translate-x-0.5 transition-transform">Open →</div></div>
          </Link>)}
        </div>
      </section>

      <section className="border-y border-black/[.05] dark:border-white/[.07] bg-black/[.015] dark:bg-white/[.018]">
        <div className="otya-shell py-12 sm:py-16 grid md:grid-cols-2 gap-6 md:gap-10">
          <Link href="/ask" className="rounded-[30px] p-6 sm:p-8 border border-black/[.06] dark:border-white/[.08] bg-white/70 dark:bg-white/[.025]">
            <div className="w-12 h-12 rounded-2xl grid place-items-center bg-[linear-gradient(145deg,#7b67ff,#48bde2)] text-white font-black">O</div>
            <h2 className="mt-7 text-2xl sm:text-3xl font-black">Ask Otya</h2>
            <p className="mt-2 text-sm sm:text-base leading-6 otya-muted max-w-[460px]">Ask for help, music ideas or where to find something. No manual required.</p>
            <div className="mt-6 text-sm font-black">Open Ask Otya →</div>
          </Link>

          <Link href="/download/otya-player" className="rounded-[30px] p-6 sm:p-8 border border-black/[.06] dark:border-white/[.08] bg-[linear-gradient(145deg,#16131f,#262044)] text-white shadow-[0_22px_60px_rgba(15,10,30,.16)]">
            <div className="text-[11px] uppercase tracking-[.14em] font-black text-white/50">Android</div>
            <h2 className="mt-7 text-2xl sm:text-3xl font-black">Your files. Your player.</h2>
            <p className="mt-2 text-sm sm:text-base leading-6 text-white/65 max-w-[460px]">Otya Player is the full native experience for local music, video and offline playback.</p>
            <div className="mt-6 inline-flex rounded-full bg-white text-black px-4 py-2.5 text-sm font-black">Get Otya</div>
          </Link>
        </div>
      </section>
    </main>
    <SiteFooter />
  </div>
}
