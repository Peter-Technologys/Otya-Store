import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { OtyaBrandMark } from '@/components/OtyaBrandMark'
import { getKV } from '@/lib/d1'

export const metadata: Metadata = {
  title: 'Otya — Your media, your way',
  description: 'Otya is an offline-first Android media experience with music discovery, nearby transfer, private media and Next, your intelligent assistant.',
  alternates: { canonical: 'https://petersmartlink.com' },
}

const CAPABILITIES = [
  ['Video', 'Local video with subtitles, audio tracks, gestures and Picture-in-Picture.'],
  ['Music', 'Songs, albums, artists, folders, playlists and background playback.'],
  ['Transfer', 'Move files directly over nearby Wi-Fi or hotspot without uploading them.'],
  ['Private', 'Protect supported media in app-private storage with device authentication.'],
  ['Tools', 'Trim, extract audio and use practical local media utilities.'],
  ['Next', 'Ask for help, answers and Otya guidance in a natural conversation.'],
]

const DISCOVERY = [
  ['Uganda right now', 'uganda'],
  ['Afrobeats', 'afrobeats'],
  ['Gospel', 'gospel'],
  ['R&B', 'rnb'],
]

export default async function HomePage() {
  let appVersion = '1.0.0'
  try {
    const { env } = await getCloudflareContext()
    const raw = await getKV(env as Record<string, unknown>).get('LATEST_BUILD_INFO')
    if (raw) appVersion = (JSON.parse(raw) as { version?: string }).version || appVersion
  } catch {}

  return <div className="min-h-screen flex flex-col bg-[color:var(--cosmos-scaffold)]">
    <SiteNav />
    <main className="flex-1">
      <section className="relative overflow-hidden border-b border-black/[.05] dark:border-white/[.07]">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_14%_12%,rgba(41,121,255,.13),transparent_30%),radial-gradient(circle_at_88%_20%,rgba(255,59,48,.07),transparent_26%),radial-gradient(circle_at_66%_88%,rgba(255,214,10,.08),transparent_24%)]" />
        <div className="otya-shell relative py-16 sm:py-24 lg:py-28 grid lg:grid-cols-[1.08fr_.92fr] gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-black/[.06] dark:border-white/[.08] px-3 py-2 text-xs font-black bg-white/55 dark:bg-white/[.03]">
              <OtyaBrandMark size={22}/><span>Otya 1.0</span>
            </div>
            <h1 className="mt-7 max-w-[760px] text-[clamp(52px,8vw,98px)] font-black tracking-[-.075em] leading-[.88]">Your media.<br/><span className="text-[color:var(--cosmos-primary)]">Your way.</span></h1>
            <p className="mt-7 max-w-[680px] text-base sm:text-xl leading-8 otya-muted">One clean place for your local video and music, nearby transfer, private media and useful tools. Otya stays useful offline, while Next is there when you want intelligent help.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/download/otya-player" className="cosmos-button inline-flex min-h-12 items-center rounded-full px-6 text-sm font-black">Get Otya for Android</Link>
              <Link href="/ask" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-black/[.08] dark:border-white/[.10] px-5 text-sm font-black bg-white/55 dark:bg-white/[.03]"><OtyaBrandMark ai size={26}/>Ask Next</Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs otya-muted"><span>Offline-first</span><span>Local media</span><span>Nearby transfer</span><span>Sign-in optional</span></div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 rounded-full bg-[radial-gradient(circle,rgba(41,121,255,.13),transparent_65%)] blur-2xl" />
            <div className="relative rounded-[34px] border border-black/[.07] dark:border-white/[.09] bg-white/72 dark:bg-white/[.035] p-3 sm:p-4 shadow-[0_30px_90px_rgba(8,11,18,.16)] backdrop-blur-xl">
              <Image src="/brand/otya-app-preview.svg" alt="Otya Android app showing Video, Music and Me" width={1200} height={820} priority className="w-full h-auto rounded-[26px]" />
            </div>
          </div>
        </div>
      </section>

      <section className="otya-shell py-14 sm:py-20">
        <div className="grid lg:grid-cols-[.78fr_1.22fr] gap-10 lg:gap-16 items-start">
          <div className="lg:sticky lg:top-24">
            <div className="otya-kicker">Built around real use</div>
            <h2 className="mt-3 text-3xl sm:text-5xl font-black tracking-[-.055em]">Everything has one clear place.</h2>
            <p className="mt-4 text-sm sm:text-base leading-7 otya-muted">Video, Music and Me stay the permanent app structure. Tools live where they belong instead of becoming separate mini-apps.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {CAPABILITIES.map(([title,text]) => <article key={title} className="rounded-[24px] border border-black/[.06] dark:border-white/[.08] bg-white/70 dark:bg-white/[.025] p-5 sm:p-6">
              <div className="flex items-center gap-3">{title === 'Next' ? <OtyaBrandMark ai size={30}/> : <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--cosmos-primary)]"/>}<h3 className="text-lg font-black">{title}</h3></div>
              <p className="mt-3 text-sm leading-6 otya-muted">{text}</p>
            </article>)}
          </div>
        </div>
      </section>

      <section className="border-y border-black/[.05] dark:border-white/[.07] bg-black/[.018] dark:bg-white/[.018]">
        <div className="otya-shell py-14 sm:py-20 grid lg:grid-cols-[1fr_.9fr] gap-10 lg:gap-16 items-center">
          <div>
            <div className="otya-kicker">Music discovery</div>
            <h2 className="mt-3 text-3xl sm:text-5xl font-black tracking-[-.055em]">Find something worth hearing.</h2>
            <p className="mt-4 max-w-[620px] text-sm sm:text-base leading-7 otya-muted">Search the web music catalog, then keep your own local library separate and private inside the Android app.</p>
            <form action="/music" className="mt-7 max-w-[680px] flex items-center gap-2 rounded-[22px] border border-black/[.07] dark:border-white/[.09] bg-white/75 dark:bg-white/[.035] p-1.5">
              <input name="q" placeholder="Song, artist, album or mood" aria-label="Search music" className="min-h-12 min-w-0 flex-1 bg-transparent px-4 text-sm outline-none" />
              <button className="cosmos-button min-h-12 rounded-[17px] px-5 font-black">Search</button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2">{DISCOVERY.map(([label,q]) => <Link key={q} href={`/music?q=${encodeURIComponent(q)}`} className="rounded-full border border-black/[.06] dark:border-white/[.08] px-3.5 py-2 text-xs font-bold otya-muted hover:text-[color:var(--cosmos-text-primary)]">{label}</Link>)}</div>
          </div>
          <div className="rounded-[30px] border border-black/[.06] dark:border-white/[.08] bg-[color:var(--cosmos-surface)] p-6 sm:p-8">
            <div className="flex items-center justify-between"><div><div className="text-xs font-black otya-muted">OTYA MUSIC</div><div className="mt-1 text-2xl font-black">Listen without the clutter.</div></div><OtyaBrandMark size={44}/></div>
            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="aspect-square rounded-[24px] bg-[linear-gradient(145deg,#2979FF,#1767E8)]"/>
              <div className="aspect-square rounded-[24px] bg-[linear-gradient(145deg,#FF3B30,#D9251C)]"/>
              <div className="aspect-square rounded-[24px] bg-[linear-gradient(145deg,#FFD60A,#E9B900)]"/>
            </div>
            <div className="mt-6 h-1.5 rounded-full bg-black/[.06] dark:bg-white/[.08] overflow-hidden"><div className="h-full w-[58%] rounded-full bg-[color:var(--cosmos-primary)]"/></div>
          </div>
        </div>
      </section>

      <section className="otya-shell py-14 sm:py-20">
        <div className="rounded-[32px] border border-black/[.06] dark:border-white/[.08] bg-[color:var(--cosmos-surface)] p-7 sm:p-10 lg:p-12 grid lg:grid-cols-[1fr_auto] gap-8 items-center shadow-[0_20px_70px_rgba(8,11,18,.07)]">
          <div className="max-w-[760px]">
            <div className="flex items-center gap-3"><OtyaBrandMark ai size={42}/><div className="otya-kicker">Next · Otya assistant</div></div>
            <h2 className="mt-5 text-3xl sm:text-5xl font-black tracking-[-.055em]">Ask naturally. Keep moving.</h2>
            <p className="mt-4 text-sm sm:text-base leading-7 otya-muted">Next can answer everyday questions and help with Otya. Owner capabilities stay protected behind server-enforced admin access.</p>
          </div>
          <Link href="/ask" className="cosmos-button inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-black whitespace-nowrap">Open Next</Link>
        </div>
      </section>

      <section className="otya-shell pb-16 sm:pb-24">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-end sm:justify-between border-t border-black/[.06] dark:border-white/[.08] pt-8">
          <div><div className="otya-kicker">Android · v{appVersion}</div><h2 className="mt-2 text-2xl sm:text-3xl font-black">Ready when you are.</h2></div>
          <Link href="/download/otya-player" className="inline-flex min-h-11 items-center text-sm font-black text-[color:var(--cosmos-primary)]">Download Otya →</Link>
        </div>
      </section>
    </main>
    <SiteFooter />
  </div>
}
