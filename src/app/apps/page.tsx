import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { SiteNav } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Apps | PeterSmart Link',
  description: 'Apps from PeterSmart Link, including OTYA Player for private, reliable Android media playback and management.',
}

export default function AppsPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <SiteNav back={{ href: '/', label: 'Home' }} />

      <main className="max-w-5xl mx-auto px-5 sm:px-6 py-12 sm:py-16">
        <header className="mb-10 max-w-2xl">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold mb-4" style={{ borderColor: 'var(--border)', color: 'var(--text-sub)', background: 'var(--card)' }}>
            PeterSmart Link Apps
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-3">Useful software, built to feel simple.</h1>
          <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-sub)' }}>
            Discover PeterSmart Link applications. Each product has a focused job, a consistent design system and a direct support path.
          </p>
        </header>

        <section className="modern-card overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
              <Image
                src="/web-app-manifest-192x192.png"
                alt="OTYA Player"
                width={82}
                height={82}
                className="rounded-[22px] object-cover shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h2 className="text-2xl font-black">OTYA Player</h2>
                  <span className="cosmos-pill text-[11px] font-bold px-2.5 py-1">ANDROID</span>
                </div>
                <p className="text-xs font-semibold mb-3" style={{ color: 'var(--cosmos-primary)' }}>
                  Offline media • Private library • Smart playback
                </p>
                <p className="text-sm leading-relaxed mb-5 max-w-2xl" style={{ color: 'var(--text-sub)' }}>
                  Play local music and video, manage your media library, use background and lock-screen playback controls, share files, protect private media, and use OTYA tools without turning your phone into a cluttered media dashboard.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Link href="/download/otya-player" className="cosmos-button inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold">
                    Download OTYA
                  </Link>
                  <Link
                    href="/otya-player"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border hover:bg-white/5"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    Explore OTYA
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
