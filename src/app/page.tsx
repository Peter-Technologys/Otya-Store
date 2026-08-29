import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getKV } from '@/lib/d1'

export const metadata: Metadata = {
  title: 'OTYA — Video, Music, Transfer and Private media',
  description:
    'OTYA is an offline-first Android media app for video and music, with local Transfer, Private media, useful tools and Ask OTYA when you want help.',
  alternates: { canonical: 'https://petersmartlink.com' },
}

export default async function HomePage() {
  // The website must remain truthful even when KV is unavailable. OTYA's v1
  // rebuild starts at 1.0.0; live release metadata replaces this when present.
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
          <div className="otya-shell py-12 sm:py-20 lg:py-24 grid lg:grid-cols-[.92fr_1.08fr] gap-9 lg:gap-16 items-center">
            <div>
              <div className="otya-kicker mb-4">OTYA for Android</div>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-[-.055em] leading-[.96] max-w-3xl">
                Your videos and music. One private, offline-first app.
              </h1>
              <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed otya-muted">
                Play local video and music, move files directly between nearby
                phones, protect private media and use practical media tools —
                without making an internet connection a requirement.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:items-center">
                <Link
                  href="/download/otya-player"
                  className="cosmos-button rounded-xl px-5 py-3 text-sm font-bold text-center"
                >
                  Download OTYA
                </Link>
                <Link
                  href="/otya-player"
                  className="otya-quiet-button rounded-xl px-5 py-3 text-sm font-bold text-center"
                >
                  See what it does
                </Link>
              </div>

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs sm:text-sm otya-muted">
                <span>Offline-first</span>
                <span>No account required for playback</span>
                <span>Local Transfer</span>
              </div>
            </div>

            <Image
              src="/brand/otya-app-preview.svg"
              alt="OTYA app showing its Video, Music and Me experience"
              width={1200}
              height={820}
              priority
              className="w-full h-auto rounded-[28px]"
            />
          </div>
        </section>

        <section className="otya-shell py-12 sm:py-16">
          <div className="max-w-2xl mb-8">
            <div className="otya-kicker mb-2">What OTYA does</div>
            <h2 className="otya-section-title">Three simple places. Everything stays organized.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
            <FeatureCard
              title="Video"
              text="Browse local videos and folders, use gestures, subtitles, audio tracks, PiP, speed controls, trim and audio extraction."
              href="/otya-player"
              linkLabel="Explore video"
            />
            <FeatureCard
              title="Music"
              text="Songs, albums, artists, folders and playlists with queue, favorites, lyrics, EQ, sleep timer and background playback."
              href="/otya-player"
              linkLabel="Explore music"
            />
            <FeatureCard
              title="Me"
              text="Transfer, Files, Private, Converter, Playlists, History, Tools, Personalize and Storage in one clear home for utilities."
              href="/otya-player"
              linkLabel="Explore tools"
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
          <div className="otya-shell py-12 sm:py-16 grid lg:grid-cols-2 gap-8 lg:gap-14 items-start">
            <div>
              <div className="otya-kicker mb-2">Built around your phone</div>
              <h2 className="otya-section-title">Useful online. Still useful offline.</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <MiniPoint
                title="Playback stays local"
                text="Video, Music, Search and your local library do not depend on Cloudflare, Firebase, account services or Ask OTYA."
              />
              <MiniPoint
                title="Transfer stays nearby"
                text="Send files directly over local Wi-Fi or hotspot instead of uploading them to a cloud drive first."
              />
              <MiniPoint
                title="Private stays on-device"
                text="Protected media uses OTYA's app-private storage and device authentication controls."
              />
              <MiniPoint
                title="Account is optional for playback"
                text="Sign in only when you want supported account, backup, recovery or cloud-assisted features."
              />
            </div>
          </div>
        </section>

        <section className="otya-shell py-12 sm:py-16">
          <div className="grid lg:grid-cols-[.8fr_1.2fr] gap-8 lg:gap-14">
            <div>
              <div className="otya-kicker mb-2">Ask OTYA</div>
              <h2 className="otya-section-title">Help when you want it. Never a playback dependency.</h2>
            </div>
            <div>
              <p className="otya-muted max-w-2xl leading-relaxed">
                Ask general questions or get OTYA-specific help when you are
                online. Signed-in users can use supported AI models, while local
                playback and media tools keep working when AI or the internet is
                unavailable.
              </p>
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
                <Link href="/apps/otya-player/support">Open support →</Link>
                <Link href="/account">OTYA Account →</Link>
              </div>
            </div>
          </div>
        </section>

        <section
          className="border-t"
          style={{ borderColor: 'var(--cosmos-divider)' }}
        >
          <div className="otya-shell py-12 sm:py-16 grid lg:grid-cols-[.8fr_1.2fr] gap-8 lg:gap-14 items-start">
            <div>
              <div className="otya-kicker mb-2">Current release</div>
              <h2 className="otya-section-title">OTYA v{appVersion}</h2>
            </div>
            <div>
              <p className="otya-muted max-w-2xl">
                Built by PeterSmart Link for Android, with offline-first local
                media playback and resilient device-first behavior at the center.
              </p>
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
                <Link href="/download/otya-player">Official download →</Link>
                <Link href="/apps/otya-player/changelog">Changelog →</Link>
                <Link href="/apps/otya-player/security">Security →</Link>
                <Link href="/developers">Developers →</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

function FeatureCard({
  title,
  text,
  href,
  linkLabel,
}: {
  title: string
  text: string
  href: string
  linkLabel: string
}) {
  return (
    <div
      className="rounded-2xl border p-5 sm:p-6"
      style={{
        borderColor: 'var(--cosmos-divider)',
        background: 'var(--cosmos-surface)',
      }}
    >
      <div className="text-lg font-extrabold tracking-[-.02em] mb-2">{title}</div>
      <p className="text-sm leading-relaxed otya-muted">{text}</p>
      <Link href={href} className="inline-block mt-4 text-sm font-semibold">
        {linkLabel} →
      </Link>
    </div>
  )
}

function MiniPoint({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <div className="text-sm font-bold mb-1">{title}</div>
      <p className="text-sm leading-relaxed otya-muted">{text}</p>
    </div>
  )
}
