import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { getKV } from '@/lib/d1'

export const metadata: Metadata = {
  title: 'OTYA — Video, Music, Transfer & Smart Help for Android',
  description: 'OTYA is an offline-first Android media experience for video and music, with local transfer, private files, conversion tools and optional intelligent help.',
  alternates: { canonical: 'https://petersmartlink.com/otya-player' },
}

const CAPABILITIES = [
  ['Video', 'Fast local playback, folders, subtitles, gestures, Picture-in-Picture and continue watching.'],
  ['Music', 'Songs, albums, artists, playlists, queue, background playback, sleep timer and equalizer.'],
  ['Transfer', 'Send and receive locally, pair nearby, connect by QR and move files without mobile data.'],
  ['Files & Private', 'Browse received files, downloads and local folders, with private media kept out of the normal library.'],
  ['Converter & Tools', 'Extract audio from video and keep useful editing and media utilities in one organized place.'],
  ['Smart Search', 'Search your device first. When online, OTYA can answer useful questions inline without forcing you into a chatbot.'],
]

export default async function OtyaPlayerPage() {
  let appVersion = '1.7.0'
  try {
    const { env } = await getCloudflareContext()
    const kv = getKV(env as Record<string, unknown>)
    const raw = await kv.get('LATEST_BUILD_INFO')
    if (raw) appVersion = (JSON.parse(raw) as { version?: string }).version || appVersion
  } catch {}

  return <div className="min-h-screen flex flex-col" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
    <SiteNav />
    <main className="flex-1">
      <section className="border-b overflow-hidden" style={{ borderColor: 'var(--cosmos-divider)' }}>
        <div className="otya-shell py-14 sm:py-20 grid lg:grid-cols-[.92fr_1.28fr] gap-10 lg:gap-14 items-center">
          <div>
            <div className="otya-kicker mb-5">OTYA · Android · v{appVersion}</div>
            <h1 className="text-5xl sm:text-7xl font-black tracking-[-.055em] leading-[.95]">Your media.<br/>One calm app.</h1>
            <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed otya-muted">Video and music stay at the center. Transfer, files, private media, conversion, themes and intelligent help appear only where they belong.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/download/otya-player" className="cosmos-button rounded-xl px-5 py-3 text-sm font-bold">Download OTYA</Link>
              <Link href="/apps/otya-player/support" className="otya-quiet-button rounded-xl px-5 py-3 text-sm font-bold">Help & support</Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs otya-muted"><span>Offline-first</span><span>Local media</span><span>Local transfer</span><span>No account required to play</span></div>
          </div>
          <div className="relative">
            <Image src="/brand/otya-app-preview.svg" alt="OTYA interface showing Video, Music and Me" width={1200} height={820} priority className="w-full h-auto rounded-[28px]" />
          </div>
        </div>
      </section>

      <section className="otya-shell py-14 sm:py-18">
        <div className="max-w-2xl mb-9"><div className="otya-kicker mb-2">One structure</div><h2 className="otya-section-title">Video. Music. Me.</h2><p className="mt-3 otya-muted">OTYA does not turn every capability into another app or another permanent tab.</p></div>
        <div className="grid md:grid-cols-3 gap-4">
          <CoreCard title="Video" text="Your videos, folders, recent media and player controls." />
          <CoreCard title="Music" text="Your songs, artists, albums, playlists and now-playing experience." />
          <CoreCard title="Me" text="Organized feature groups, settings and your profile—without dashboard clutter." />
        </div>
      </section>

      <section className="border-y" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-surface)' }}>
        <div className="otya-shell py-14 sm:py-18">
          <div className="max-w-2xl mb-8"><div className="otya-kicker mb-2">Capabilities</div><h2 className="otya-section-title">Powerful when you need it.</h2></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-9">
            {CAPABILITIES.map(([title, body]) => <div key={title}><h3 className="font-bold mb-2">{title}</h3><p className="text-sm leading-relaxed otya-muted">{body}</p></div>)}
          </div>
        </div>
      </section>

      <section className="otya-shell py-14 sm:py-18 grid lg:grid-cols-[.85fr_1.15fr] gap-10 lg:gap-16">
        <div><div className="otya-kicker mb-2">Offline by design</div><h2 className="otya-section-title">The cloud is an enhancement, not a requirement.</h2></div>
        <div className="space-y-7">
          <Principle title="Playback remains local" text="Video, music, playlists, themes, media scanning and core settings continue to work without an internet connection." />
          <Principle title="Transfers remain local" text="Nearby file movement is designed to work device-to-device instead of routing personal media through OTYA servers." />
          <Principle title="Intelligence stays optional" text="Search works locally first. Online intelligence can add direct answers and support when connectivity is available." />
        </div>
      </section>

      <section className="otya-shell pb-16 sm:pb-20">
        <div className="border-y py-8 flex flex-col md:flex-row md:items-center justify-between gap-6" style={{ borderColor: 'var(--cosmos-divider)' }}>
          <div><div className="otya-kicker mb-2">OTYA v{appVersion}</div><h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Built around the media already on your phone.</h2></div>
          <div className="flex flex-wrap gap-3"><Link href="/download/otya-player" className="cosmos-button px-5 py-3 rounded-xl font-bold text-sm">Get OTYA</Link><Link href="/apps/otya-player/changelog" className="otya-quiet-button px-5 py-3 rounded-xl font-bold text-sm">Changelog</Link></div>
        </div>
      </section>
    </main>
    <SiteFooter />
  </div>
}

function CoreCard({title,text}:{title:string;text:string}){
  return <div className="border-t pt-5" style={{ borderColor: 'var(--cosmos-divider)' }}><h3 className="text-xl font-bold tracking-tight">{title}</h3><p className="mt-2 text-sm leading-relaxed otya-muted">{text}</p></div>
}

function Principle({title,text}:{title:string;text:string}){
  return <div className="border-t pt-5" style={{ borderColor: 'var(--cosmos-divider)' }}><h3 className="font-bold">{title}</h3><p className="mt-2 text-sm leading-relaxed otya-muted">{text}</p></div>
}
