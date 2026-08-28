import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { SiteNav } from '@/components/ui'

export const metadata: Metadata = {
  title: 'OTYA | Android media player',
  description: 'OTYA is an offline-first Android music and video player with sharing, private media, tools and optional connected help.',
}

export default function AppsPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <SiteNav back={{ href: '/', label: 'Home' }} />
      <main className="max-w-5xl mx-auto px-5 sm:px-6 py-12 sm:py-16">
        <header className="mb-10 max-w-3xl">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold mb-4" style={{ borderColor: 'var(--border)', color: 'var(--text-sub)', background: 'var(--card)' }}>OTYA</div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-3">One app for your media.</h1>
          <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-sub)' }}>
            OTYA plays your local music and video, helps you share and organize files, and keeps core playback working without an account or internet connection.
          </p>
        </header>

        <section className="modern-card overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
              <Image src="/web-app-manifest-192x192.png" alt="OTYA" width={82} height={82} className="rounded-[22px] object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h2 className="text-2xl font-black">OTYA</h2>
                  <span className="cosmos-pill text-[11px] font-bold px-2.5 py-1">ANDROID</span>
                </div>
                <p className="text-xs font-semibold mb-3" style={{ color: 'var(--cosmos-primary)' }}>Video • Music • Transfer • Private • Tools</p>
                <p className="text-sm leading-relaxed mb-5 max-w-2xl" style={{ color: 'var(--text-sub)' }}>
                  Play local media, manage your library, send and receive files, protect private media, convert supported files and use simple media tools. Ask OTYA is available when you need online help, but it is not required for local playback.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/download/otya-player" className="cosmos-button inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-bold">Download OTYA</Link>
                  <Link href="/otya-player" className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: 'var(--border)' }}>Explore OTYA</Link>
                  <Link href="/apps/otya-player/support" className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: 'var(--border)' }}>Help</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border p-5 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--text-sub)' }}>
          <strong style={{ color: 'var(--text)' }}>Your OTYA account is optional for core playback.</strong> Use it for account security, backup, sync and connected features. Local music and video should still work when account or AI services are unavailable.
        </section>

        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <Link href="/docs" className="font-semibold" style={{ color: 'var(--cosmos-primary)' }}>Docs</Link>
          <Link href="/account" className="font-semibold" style={{ color: 'var(--cosmos-primary)' }}>My account</Link>
          <Link href="/apps/otya-player/support" className="font-semibold" style={{ color: 'var(--cosmos-primary)' }}>Support</Link>
        </div>
      </main>
    </div>
  )
}
