import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getKV } from '@/lib/d1'

export const metadata: Metadata = {
  title: 'OTYA',
  description: 'OTYA is an offline-first Android media experience for video and music, with local transfer, private files, useful tools and optional intelligent help.',
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

  return <div className="min-h-screen flex flex-col" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
    <SiteNav />
    <main className="flex-1">
      <section className="border-b overflow-hidden" style={{ borderColor: 'var(--cosmos-divider)' }}>
        <div className="otya-shell py-16 sm:py-24 grid lg:grid-cols-[.9fr_1.1fr] gap-10 lg:gap-16 items-center">
          <div>
            <div className="otya-kicker mb-5">OTYA · by PeterSmart Link</div>
            <h1 className="text-5xl sm:text-7xl font-black tracking-[-.055em] leading-[.95]">Play it.<br/>Move it.<br/>Find it.</h1>
            <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed otya-muted">One offline-first media app for the videos and music already on your phone—with transfer, privacy, useful tools and intelligent search woven into the same experience.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/otya-player" className="cosmos-button rounded-xl px-5 py-3 text-sm font-bold">Explore OTYA</Link>
              <Link href="/download/otya-player" className="otya-quiet-button rounded-xl px-5 py-3 text-sm font-bold">Download</Link>
            </div>
          </div>
          <Image src="/brand/otya-app-preview.svg" alt="OTYA app interface" width={1200} height={820} priority className="w-full h-auto rounded-[28px]" />
        </div>
      </section>

      <section className="otya-shell py-14 sm:py-18">
        <div className="grid md:grid-cols-[.72fr_1.28fr] gap-8 md:gap-14">
          <div><div className="otya-kicker mb-2">The product</div><h2 className="otya-section-title">One app. Clear places.</h2></div>
          <div className="grid sm:grid-cols-3 gap-7">
            <Principle title="Video" text="Local videos, folders, subtitles, gestures and playback." />
            <Principle title="Music" text="Songs, albums, artists, playlists, queue and background audio." />
            <Principle title="Me" text="Transfer, files, private media, converter, tools, personalization and settings—organized instead of crowded." />
          </div>
        </div>
      </section>

      <section className="border-y" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-surface)' }}>
        <div className="otya-shell py-14 sm:py-18 grid md:grid-cols-[.72fr_1.28fr] gap-8 md:gap-14">
          <div><div className="otya-kicker mb-2">Intelligence</div><h2 className="otya-section-title">AI where it helps, not another app.</h2></div>
          <div>
            <p className="otya-muted max-w-2xl">OTYA searches your device first. When online, intelligent answers can appear inside Search and Support, with longer follow-up only when you ask for it. Core playback never depends on AI or sign-in.</p>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium"><Link href="/apps/otya-player/support">Help & support →</Link><Link href="/account">Account →</Link></div>
          </div>
        </div>
      </section>

      <section className="otya-shell py-14 sm:py-18">
        <div className="grid md:grid-cols-[.72fr_1.28fr] gap-8 md:gap-14">
          <div><div className="otya-kicker mb-2">Release</div><h2 className="otya-section-title">OTYA v{appVersion}</h2></div>
          <div><p className="otya-muted max-w-2xl">Built for Android with local playback and resilient offline behavior at the center.</p><div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium"><Link href="/download/otya-player">Official download →</Link><Link href="/apps/otya-player/changelog">Changelog →</Link><Link href="/apps/otya-player/security">Security →</Link></div></div>
        </div>
      </section>
    </main>
    <SiteFooter />
  </div>
}

function Principle({title,text}:{title:string;text:string}){
  return <div><div className="text-sm font-semibold mb-1">{title}</div><p className="text-sm leading-relaxed otya-muted">{text}</p></div>
}
