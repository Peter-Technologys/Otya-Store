import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { getKV } from '@/lib/d1'

export const metadata: Metadata = {
  title: 'OTYA — Video, Music, Transfer & Private Media for Android',
  description:
    'OTYA is an offline-first Android media app for video and music, with local Transfer, Private media, useful tools and optional Ask OTYA help.',
  alternates: { canonical: 'https://petersmartlink.com/otya-player' },
}

const CAPABILITIES = [
  [
    'Video',
    'Local playback, folders, subtitles, audio tracks, gestures, Picture-in-Picture, speed controls, trim and audio extraction.',
  ],
  [
    'Music',
    'Songs, albums, artists, folders, playlists, queue, favorites, lyrics, background playback, sleep timer and equalizer.',
  ],
  [
    'Transfer',
    'Send and receive directly over nearby Wi-Fi or hotspot, with authenticated local connections and no cloud upload requirement.',
  ],
  [
    'Files & Private',
    'Browse local and received media, with protected files moved into OTYA app-private storage behind device authentication and Private PIN controls.',
  ],
  [
    'Converter & Tools',
    'Extract audio from video, trim local clips, tune playback and keep practical media utilities in one organized place.',
  ],
  [
    'Ask OTYA',
    'Use a conversational assistant for OTYA help and general questions when online, while local playback remains independent of AI.',
  ],
]

export default async function OtyaPlayerPage() {
  let appVersion = '1.0.0'
  try {
    const { env } = await getCloudflareContext()
    const kv = getKV(env as Record<string, unknown>)
    const raw = await kv.get('LATEST_BUILD_INFO')
    if (raw) appVersion = (JSON.parse(raw) as { version?: string }).version || appVersion
  } catch {}

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'var(--cosmos-scaffold)',
        color: 'var(--cosmos-text-primary)',
      }}
    >
      <SiteNav />
      <main className="flex-1">
        <section
          className="border-b overflow-hidden"
          style={{ borderColor: 'var(--cosmos-divider)' }}
        >
          <div className="otya-shell py-12 sm:py-20 grid lg:grid-cols-[.92fr_1.28fr] gap-9 lg:gap-14 items-center">
            <div>
              <div className="otya-kicker mb-4">OTYA · Android · v{appVersion}</div>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-[-.055em] leading-[.96]">
                Video. Music. Transfer. Private.
              </h1>
              <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed otya-muted">
                OTYA keeps the media already on your phone at the center. Play
                it, organize it, move it locally, protect private files and use
                practical tools without turning every feature into another app.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/download/otya-player"
                  className="cosmos-button rounded-xl px-5 py-3 text-sm font-bold text-center"
                >
                  Download OTYA
                </Link>
                <Link
                  href="/apps/otya-player/support"
                  className="otya-quiet-button rounded-xl px-5 py-3 text-sm font-bold text-center"
                >
                  Ask OTYA & support
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs otya-muted">
                <span>Offline-first</span>
                <span>Local media</span>
                <span>Local Transfer</span>
                <span>No account required to play</span>
              </div>
            </div>
            <Image
              src="/brand/otya-app-preview.svg"
              alt="OTYA interface showing Video, Music and Me"
              width={1200}
              height={820}
              priority
              className="w-full h-auto rounded-[28px]"
            />
          </div>
        </section>

        <section className="otya-shell py-12 sm:py-16">
          <div className="max-w-2xl mb-8">
            <div className="otya-kicker mb-2">One structure</div>
            <h2 className="otya-section-title">Video. Music. Me.</h2>
            <p className="mt-3 otya-muted">
              The three main places stay predictable so powerful features do not
              turn the app into a crowded dashboard.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <CoreCard
              title="Video"
              text="Your videos, folders, recent media and full player controls."
            />
            <CoreCard
              title="Music"
              text="Songs, artists, albums, playlists, queue and your now-playing experience."
            />
            <CoreCard
              title="Me"
              text="Transfer, Files, Private, Converter, Playlists, History, Tools, Personalize and Storage."
            />
          </div>
        </section>

        <section
          className="border-y"
          style={{
            borderColor: 'var(--cosmos-divider)',
            background: 'var(--cosmos-surface)',
          }}
        >
          <div className="otya-shell py-12 sm:py-16">
            <div className="max-w-2xl mb-8">
              <div className="otya-kicker mb-2">Capabilities</div>
              <h2 className="otya-section-title">Powerful when you need it.</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-9">
              {CAPABILITIES.map(([title, body]) => (
                <div key={title}>
                  <h3 className="font-bold mb-2">{title}</h3>
                  <p className="text-sm leading-relaxed otya-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="otya-shell py-12 sm:py-16 grid lg:grid-cols-[.85fr_1.15fr] gap-9 lg:gap-16">
          <div>
            <div className="otya-kicker mb-2">Offline by design</div>
            <h2 className="otya-section-title">The cloud is an enhancement, not a requirement.</h2>
          </div>
          <div className="space-y-7">
            <Principle
              title="Playback remains local"
              text="Video, Music, local Search, playlists, themes, media scanning and core settings continue to work without an internet connection."
            />
            <Principle
              title="Transfers remain local"
              text="Nearby file movement works device-to-device instead of routing personal media through OTYA servers."
            />
            <Principle
              title="Ask OTYA stays optional"
              text="Use the assistant when you want online help. Your local library and playback do not wait for AI, Firebase or Cloudflare."
            />
          </div>
        </section>

        <section className="otya-shell pb-14 sm:pb-20">
          <div
            className="border-y py-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
            style={{ borderColor: 'var(--cosmos-divider)' }}
          >
            <div>
              <div className="otya-kicker mb-2">OTYA v{appVersion}</div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Built around the media already on your phone.
              </h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/download/otya-player"
                className="cosmos-button px-5 py-3 rounded-xl font-bold text-sm text-center"
              >
                Get OTYA
              </Link>
              <Link
                href="/apps/otya-player/changelog"
                className="otya-quiet-button px-5 py-3 rounded-xl font-bold text-sm text-center"
              >
                Changelog
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

function CoreCard({ title, text }: { title: string; text: string }) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        borderColor: 'var(--cosmos-divider)',
        background: 'var(--cosmos-surface)',
      }}
    >
      <h3 className="text-xl font-bold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed otya-muted">{text}</p>
    </div>
  )
}

function Principle({ title, text }: { title: string; text: string }) {
  return (
    <div className="border-t pt-5" style={{ borderColor: 'var(--cosmos-divider)' }}>
      <h3 className="font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed otya-muted">{text}</p>
    </div>
  )
}
