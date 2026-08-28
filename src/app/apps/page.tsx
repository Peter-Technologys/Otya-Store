import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { SiteNav } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Products | OTYA',
  description: 'Official OTYA products and services, including OTYA Player and the standalone OTYA AI service.',
}

export default function AppsPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <SiteNav back={{ href: '/', label: 'Home' }} />

      <main className="max-w-5xl mx-auto px-5 sm:px-6 py-12 sm:py-16">
        <header className="mb-10 max-w-3xl">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold mb-4" style={{ borderColor: 'var(--border)', color: 'var(--text-sub)', background: 'var(--card)' }}>
            OTYA Products & Services
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-3">One OTYA account. Different products.</h1>
          <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-sub)' }}>
            OTYA Player and OTYA AI are separate products that can use the same OTYA identity. Product data stays separately scoped, and OTYA Player keeps its core local-media experience usable without AI or a cloud connection.
          </p>
        </header>

        <div className="grid gap-5">
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
                    <span className="cosmos-pill text-[11px] font-bold px-2.5 py-1">ANDROID APP</span>
                  </div>
                  <p className="text-xs font-semibold mb-3" style={{ color: 'var(--cosmos-primary)' }}>
                    Offline media • Private library • Smart playback
                  </p>
                  <p className="text-sm leading-relaxed mb-5 max-w-2xl" style={{ color: 'var(--text-sub)' }}>
                    Play local music and video, manage your media library, use background and lock-screen playback controls, share files and use optional connected OTYA services without making cloud access a requirement for local playback.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <Link href="/download/otya-player" className="cosmos-button inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold">
                      Download OTYA Player
                    </Link>
                    <Link href="/otya-player" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border hover:bg-white/5" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                      Explore OTYA Player
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="modern-card overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
                <div className="w-[82px] h-[82px] shrink-0 rounded-[22px] grid place-items-center text-3xl font-black text-white cosmos-button" aria-hidden="true">O</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h2 className="text-2xl font-black">OTYA AI</h2>
                    <span className="cosmos-pill text-[11px] font-bold px-2.5 py-1">CLOUD SERVICE</span>
                  </div>
                  <p className="text-xs font-semibold mb-3" style={{ color: 'var(--cosmos-primary)' }}>
                    General assistant • OTYA help • Multiple models
                  </p>
                  <p className="text-sm leading-relaxed mb-5 max-w-2xl" style={{ color: 'var(--text-sub)' }}>
                    OTYA AI is a standalone assistant service, not a model bundled inside OTYA Player. Use it on the web or through supported OTYA clients for general questions, writing, learning, coding and OTYA support. Signed-in users can save conversations and use account-based model and quota features.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/ai" className="cosmos-button inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold">
                      Open OTYA AI
                    </Link>
                    <Link href="/my-account#ai" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border hover:bg-white/5" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                      AI account settings
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border p-5 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--text-sub)' }}>
          <strong style={{ color: 'var(--text)' }}>Shared identity, separated data.</strong> Your OTYA account can identify you across OTYA products, while each product receives only the data and permissions it needs. OTYA AI or account outages must not prevent OTYA Player from opening or playing local media.
        </section>

        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <Link href="/docs" className="font-semibold" style={{ color: 'var(--cosmos-primary)' }}>OTYA Docs</Link>
          <Link href="/my-account" className="font-semibold" style={{ color: 'var(--cosmos-primary)' }}>My OTYA account</Link>
          <Link href="/apps/otya-player/support" className="font-semibold" style={{ color: 'var(--cosmos-primary)' }}>Support</Link>
        </div>
      </main>
    </div>
  )
}
