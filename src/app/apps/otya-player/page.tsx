import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'OTYA Player — Offline Media Player | PeterSmart Link',
  description: 'OTYA Player is PeterSmart Link’s private, offline-first Android media player with music, video, sharing, media tools and secure local features.',
  alternates: { canonical: 'https://petersmartlink.com/apps/otya-player/' },
}

const features = [
  ['Offline-first playback', 'Play local music and video without requiring an account or internet connection.'],
  ['Modern media controls', 'Background audio, lock-screen controls, queues, seeking, speed controls and Android media integration.'],
  ['Private media tools', 'Useful local tools for files, trimming, sharing, playback history and secure media management.'],
]

export default function OtyaPlayerPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
      <SiteNav />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex flex-col md:flex-row md:items-center gap-8 mb-12">
          <div
            className="w-24 h-24 rounded-[28px] border flex items-center justify-center shrink-0"
            style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }}
            aria-label="OTYA Player"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-black"
              style={{ background: 'var(--cosmos-primary)' }}
            >
              O
            </div>
          </div>

          <div className="flex-1">
            <div className="text-xs font-bold tracking-[0.18em] uppercase mb-3" style={{ color: 'var(--cosmos-primary)' }}>
              PeterSmart Link · Android
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-3">OTYA Player</h1>
            <p className="text-base sm:text-lg leading-relaxed max-w-2xl mb-6" style={{ color: 'var(--cosmos-text-secondary)' }}>
              A fast, private media experience built around your own music and videos — with an offline-first core and optional connected services when you need them.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/download/otya-player" className="cosmos-button inline-flex items-center px-5 py-3 rounded-xl font-semibold text-sm">
                Download OTYA
              </Link>
              <Link href="/apps/otya-player/support" className="inline-flex items-center px-5 py-3 rounded-xl text-sm font-semibold border" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-card)', color: 'var(--cosmos-text-primary)' }}>
                Support
              </Link>
            </div>
          </div>
        </div>

        <section className="grid sm:grid-cols-3 gap-4 mb-10">
          {features.map(([title, body]) => (
            <article key={title} className="cosmos-card p-5">
              <div className="w-9 h-1 rounded-full mb-5" style={{ background: 'var(--cosmos-primary)' }} />
              <h2 className="font-bold text-base mb-2">{title}</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--cosmos-text-secondary)' }}>{body}</p>
            </article>
          ))}
        </section>

        <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm border-t pt-6" style={{ borderColor: 'var(--cosmos-divider)' }}>
          <Link href="/apps/otya-player/privacy" style={{ color: 'var(--cosmos-text-secondary)' }}>Privacy</Link>
          <Link href="/apps/otya-player/terms" style={{ color: 'var(--cosmos-text-secondary)' }}>Terms</Link>
          <Link href="/apps/otya-player/changelog" style={{ color: 'var(--cosmos-text-secondary)' }}>Changelog</Link>
          <Link href="/apps" style={{ color: 'var(--cosmos-primary)' }}>All apps</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
