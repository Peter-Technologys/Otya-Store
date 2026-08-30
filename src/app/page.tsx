import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { getKV } from '@/lib/d1'

export const metadata: Metadata = {
  title: 'Otya — Music, video and nearby transfer',
  description: 'Otya brings online music discovery together with an offline-first Android app for local video, music, nearby transfer and private media.',
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

const APP_FEATURES = [
  ['Video', 'Play local video with subtitles, audio tracks, gestures and Picture-in-Picture.'],
  ['Music', 'Play songs, artists, albums, folders and playlists, with background playback.'],
  ['Transfer', 'Move files directly over nearby Wi-Fi or hotspot without uploading personal media to Otya.'],
  ['Private', 'Keep supported media in app-private storage behind your device authentication and Private controls.'],
  ['Tools', 'Use practical media tools such as trim and audio extraction when available in the app.'],
]

export default async function HomePage() {
  let appVersion = '1.0.0'
  try {
    const { env } = await getCloudflareContext()
    const raw = await getKV(env as Record<string, unknown>).get('LATEST_BUILD_INFO')
    if (raw) appVersion = (JSON.parse(raw) as { version?: string }).version || appVersion
  } catch {}

  return <div className="min-h-screen flex flex-col otya-ambient">
    <SiteNav />
    <main className="flex-1">
      <section className="otya-shell pt-12 sm:pt-18 lg:pt-24 pb-14 sm:pb-20">
        <div className="max-w-[820px]">
          <div className="otya-kicker">Otya</div>
          <h1 className="mt-4 text-[clamp(46px,8vw,92px)] font-black tracking-[-.07em] leading-[.9]">Your media.<br/>Your way.</h1>
          <p className="mt-6 max-w-[680px] text-base sm:text-xl leading-8 otya-muted">Discover music on the web and use Otya on Android for local video, music, nearby transfer and private media. The core player stays useful even when you are offline.</p>
        </div>
      </section>

      <section id="music" className="scroll-mt-20 border-y border-black/[.05] dark:border-white/[.07] bg-black/[.015] dark:bg-white/[.018]">
        <div className="otya-shell py-12 sm:py-18">
          <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-8 lg:gap-14 items-center">
            <div>
              <div className="otya-kicker">Music</div>
              <h2 className="mt-3 text-3xl sm:text-5xl font-black tracking-[-.05em]">Find something to hear.</h2>
              <p className="mt-3 text-sm sm:text-base leading-7 otya-muted max-w-[560px]">Search by song, artist, album or mood. This section is only for music discovery, so it does not repeat app download information.</p>

              <form action="/music" className="mt-7 max-w-[690px] rounded-[24px] p-1.5 otya-glass shadow-[0_18px_60px_rgba(28,21,55,.08)] flex items-center gap-2">
                <span className="pl-3 text-lg opacity-55" aria-hidden="true">⌕</span>
                <input name="q" placeholder="Song, artist, album or mood" aria-label="Search music" className="min-h-12 min-w-0 flex-1 rounded-2xl px-2 outline-none bg-transparent text-[15px]" />
                <button className="cosmos-button min-h-12 rounded-[18px] px-5 sm:px-7 font-black">Search</button>
              </form>

              <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-w-[700px]">
                {MOODS.map(([label,query,short]) => <Link key={label} href={`/music?q=${encodeURIComponent(query)}`} className="rounded-[20px] border border-black/[.055] dark:border-white/[.07] px-4 py-4 bg-white/55 dark:bg-white/[.025] hover:-translate-y-0.5 transition-transform">
                  <div className="text-[10px] font-black otya-muted">{short}</div>
                  <div className="mt-2 font-black leading-tight">{label}</div>
                </Link>)}
              </div>
            </div>

            <div className="relative min-h-[330px] sm:min-h-[410px]">
              <div className="absolute inset-0 rounded-[38px] overflow-hidden border border-black/[.06] dark:border-white/[.08] bg-[linear-gradient(145deg,#171326,#24205a_48%,#132d3a)] shadow-[0_30px_90px_rgba(14,10,30,.25)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(188,119,255,.42),transparent_28%),radial-gradient(circle_at_80%_22%,rgba(75,194,255,.30),transparent_27%),radial-gradient(circle_at_50%_95%,rgba(229,102,181,.28),transparent_30%)]" />
                <div className="absolute inset-x-5 top-5 flex items-center justify-between text-white/70 text-[11px] font-bold"><span>Otya Music</span><span>Now playing</span></div>
                <div className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 w-[180px] sm:w-[220px] aspect-square rounded-[34px] bg-[linear-gradient(145deg,#f0b4ff,#8272ff_48%,#4bc0dc)] shadow-[0_28px_70px_rgba(0,0,0,.35)] grid place-items-center">
                  <div className="w-[72%] h-[72%] rounded-full bg-black/75 grid place-items-center shadow-inner"><div className="w-[28%] h-[28%] rounded-full bg-white/85" /></div>
                </div>
                <div className="absolute inset-x-6 bottom-7 text-white">
                  <div className="text-[11px] uppercase tracking-[.14em] font-black text-white/50">A sound for right now</div>
                  <div className="mt-2 text-2xl sm:text-3xl font-black tracking-[-.045em]">Press play. Keep moving.</div>
                  <div className="mt-5 h-1 rounded-full bg-white/15 overflow-hidden"><div className="h-full w-[58%] bg-white rounded-full" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="app" className="scroll-mt-20 otya-shell py-12 sm:py-20">
        <div className="grid lg:grid-cols-[.9fr_1.1fr] gap-9 lg:gap-14 items-center">
          <div>
            <div className="otya-kicker">Android · v{appVersion}</div>
            <h2 className="mt-3 text-3xl sm:text-5xl font-black tracking-[-.05em]">Otya on your phone.</h2>
            <p className="mt-4 text-sm sm:text-base leading-7 otya-muted max-w-[560px]">Play your local video and music, move files nearby and keep supported media private. Core playback does not require an account or internet connection.</p>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs otya-muted"><span>Offline-first</span><span>Local media</span><span>Nearby transfer</span><span>Sign-in optional</span></div>
            <Link href="/download/otya-player" className="mt-7 inline-flex cosmos-button rounded-full px-6 py-3.5 text-sm font-black">Download Otya</Link>
          </div>
          <Image src="/brand/otya-app-preview.svg" alt="Otya Android app showing Video, Music and Me" width={1200} height={820} priority className="w-full h-auto rounded-[30px] drop-shadow-2xl" />
        </div>
      </section>

      <section className="border-y border-black/[.05] dark:border-white/[.07] bg-black/[.015] dark:bg-white/[.018]">
        <div className="otya-shell py-12 sm:py-18">
          <div className="max-w-2xl">
            <div className="otya-kicker">What the app does</div>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-[-.045em]">One capability per block.</h2>
            <p className="mt-3 text-sm sm:text-base leading-7 otya-muted">No repeated download buttons and no separate Ask Otya promotion. The animated Otya mark in the header is the assistant entry.</p>
          </div>
          <div className="mt-7 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {APP_FEATURES.map(([title,text]) => <article key={title} className="modern-card p-5 sm:p-6"><h3 className="text-lg font-black">{title}</h3><p className="mt-2 text-sm leading-6 otya-muted">{text}</p></article>)}
          </div>
        </div>
      </section>
    </main>
    <SiteFooter />
  </div>
}
