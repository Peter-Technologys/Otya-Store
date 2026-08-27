import Link from 'next/link'
import type { Metadata } from 'next'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { getKV } from '@/lib/d1'

export const metadata: Metadata = {
  title: 'OTYA Player — Offline Music & Video for Android',
  description: 'OTYA Player by PeterSmart Link is an offline-first Android media experience for music, video, private media tools, sharing and playback controls.',
  alternates: { canonical: 'https://petersmartlink.com/otya-player' },
}

const FEATURES = [
  ['Audio', 'Background playback, queue, shuffle, repeat, speed, sleep timer, equalizer and lyrics.'],
  ['Video', 'Hardware-accelerated playback, gestures, subtitles and Picture-in-Picture.'],
  ['Private Vault', 'Protect selected local media with encrypted storage and device authentication.'],
  ['Flash Share', 'Move files locally between devices without depending on mobile data.'],
  ['Web Mirror', 'Access supported local media from a browser on the same Wi-Fi network.'],
  ['Storage Tools', 'Understand media storage, find duplicates and keep the library organized.'],
]

function OtyaMark({ size = 112 }: { size?: number }) {
  return <div className="rounded-[30px] flex items-center justify-center border" style={{ width: size, height: size, borderColor: 'rgba(139,92,246,.32)', background: 'linear-gradient(145deg, rgba(139,92,246,.18), rgba(17,17,24,.98))', boxShadow: '0 24px 70px rgba(80,45,160,.24)' }}>
    <svg width={Math.round(size * .46)} height={Math.round(size * .46)} viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <circle cx="17" cy="17" r="15" stroke="#A78BFA" strokeWidth="2" opacity=".88" />
      <path d="M14 11.5L24 17L14 22.5V11.5Z" fill="#F7F5FF" />
    </svg>
  </div>
}

export default async function OtyaPlayerPage() {
  let appVersion = '1.6.0'
  try {
    const { env } = await getCloudflareContext()
    const kv = getKV(env as Record<string, unknown>)
    const raw = await kv.get('LATEST_BUILD_INFO')
    if (raw) appVersion = (JSON.parse(raw) as { version?: string }).version || appVersion
  } catch {}

  return <div className="min-h-screen flex flex-col" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
    <SiteNav />

    <main className="flex-1">
      <section className="relative overflow-hidden border-b" style={{ borderColor: 'var(--cosmos-divider)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 70% 35%, rgba(124,58,237,.17), transparent 40%)' }} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 relative">
          <div className="grid lg:grid-cols-[1fr_.75fr] gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold mb-6" style={{ borderColor: 'rgba(139,92,246,.25)', background: 'rgba(139,92,246,.08)', color: '#C4B5FD' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Current release · v{appVersion}
              </div>
              <p className="text-xs uppercase tracking-[.22em] font-semibold mb-4" style={{ color: 'var(--cosmos-primary)' }}>OTYA Player · by PeterSmart Link</p>
              <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[.98] mb-6">Your media.<br/><span style={{ color: 'var(--cosmos-primary)' }}>Your way.</span></h1>
              <p className="text-base sm:text-lg leading-relaxed max-w-2xl" style={{ color: 'var(--cosmos-text-secondary)' }}>A private, offline-first Android media experience for music and video, with useful playback, sharing and media-management tools built around your own files.</p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link href="/download/otya-player" className="cosmos-button px-6 py-3.5 rounded-xl font-bold text-sm">Download OTYA</Link>
                <Link href="/apps/otya-player/support" className="px-6 py-3.5 rounded-xl border font-bold text-sm" style={{ borderColor: 'var(--cosmos-divider)' }}>Support</Link>
                <Link href="/apps/otya-player/security" className="px-6 py-3.5 rounded-xl border font-bold text-sm" style={{ borderColor: 'var(--cosmos-divider)' }}>Security</Link>
              </div>
              <div className="flex flex-wrap gap-x-7 gap-y-2 mt-8 text-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>
                <span>Android</span><span>Offline first</span><span>No subscription</span><span>Local media</span>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end"><OtyaMark size={190} /></div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="max-w-2xl mb-10">
          <p className="text-xs uppercase tracking-[.2em] font-semibold mb-3" style={{ color: 'var(--cosmos-primary)' }}>Built around playback</p>
          <h2 className="text-3xl sm:text-4xl font-black mb-3">More than a list of files.</h2>
          <p className="leading-relaxed" style={{ color: 'var(--cosmos-text-secondary)' }}>OTYA connects your library, queue, artwork, background playback and system controls into one experience.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(([title, body], i) => <div key={title} className="modern-card p-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black mb-5" style={{ background: 'rgba(139,92,246,.10)', color: '#A78BFA' }}>{String(i + 1).padStart(2, '0')}</div>
            <h3 className="font-black text-lg mb-2">{title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--cosmos-text-secondary)' }}>{body}</p>
          </div>)}
        </div>
      </section>

      <section className="border-y" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-surface)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid md:grid-cols-3 gap-7">
          {[
            ['Private by default', 'Normal playback happens on the device. Your local library is not uploaded just to play it.'],
            ['Works offline', 'Core playback and library use remain useful without a mobile-data connection.'],
            ['System integrated', 'Now Playing controls are designed for notifications, the lock screen and connected media controls.'],
          ].map(([title, body]) => <div key={title}><h3 className="font-black mb-2">{title}</h3><p className="text-sm leading-relaxed" style={{ color: 'var(--cosmos-text-secondary)' }}>{body}</p></div>)}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="modern-card p-6"><p className="text-xs uppercase tracking-[.18em] font-semibold mb-3" style={{ color: 'var(--cosmos-primary)' }}>Official download</p><h2 className="font-black text-xl mb-2">Install from PeterSmart Link.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--cosmos-text-secondary)' }}>Use the official download page for production OTYA APKs. Avoid unknown third-party redistribution.</p><Link href="/download/otya-player" className="text-sm font-bold" style={{ color: 'var(--cosmos-primary)' }}>Go to official download →</Link></div>
          <div className="modern-card p-6"><p className="text-xs uppercase tracking-[.18em] font-semibold mb-3" style={{ color: 'var(--cosmos-primary)' }}>Release information</p><h2 className="font-black text-xl mb-2">See what changed.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--cosmos-text-secondary)' }}>The public changelog is the customer-facing record for OTYA updates and release notes.</p><Link href="/apps/otya-player/changelog" className="text-sm font-bold" style={{ color: 'var(--cosmos-primary)' }}>View changelog →</Link></div>
          <div className="modern-card p-6"><p className="text-xs uppercase tracking-[.18em] font-semibold mb-3" style={{ color: 'var(--cosmos-primary)' }}>Private source</p><h2 className="font-black text-xl mb-2">Source repositories are not public distribution.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--cosmos-text-secondary)' }}>OTYA Player and OTYA Server source repositories are private. Visitors should use this website for downloads, support and security information.</p><Link href="/apps/otya-player/security" className="text-sm font-bold" style={{ color: 'var(--cosmos-primary)' }}>Read security guidance →</Link></div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 pt-0">
        <div className="rounded-[28px] border p-7 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-8" style={{ borderColor: 'var(--cosmos-divider)', background: 'linear-gradient(145deg, rgba(20,20,28,.95), rgba(10,10,15,.96))' }}>
          <div className="flex items-center gap-5"><OtyaMark size={74} /><div><p className="text-xs uppercase tracking-[.18em] font-semibold mb-2" style={{ color: 'var(--cosmos-primary)' }}>OTYA Player v{appVersion}</p><h2 className="text-2xl sm:text-3xl font-black">Ready for your Android phone.</h2></div></div>
          <div className="flex flex-wrap gap-3"><Link href="/download/otya-player" className="cosmos-button px-5 py-3 rounded-xl font-bold text-sm">Get OTYA</Link><Link href="/apps/otya-player/changelog" className="px-5 py-3 rounded-xl border font-bold text-sm" style={{ borderColor: 'var(--cosmos-divider)' }}>Changelog</Link></div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <Link href="/apps/otya-player/privacy" className="px-4 py-2 rounded-xl border text-xs font-semibold" style={{ borderColor: 'var(--cosmos-divider)' }}>Privacy Policy</Link>
          <Link href="/apps/otya-player/terms" className="px-4 py-2 rounded-xl border text-xs font-semibold" style={{ borderColor: 'var(--cosmos-divider)' }}>Terms of Service</Link>
          <Link href="/apps/otya-player/support" className="px-4 py-2 rounded-xl border text-xs font-semibold" style={{ borderColor: 'var(--cosmos-divider)' }}>Support &amp; FAQ</Link>
          <Link href="/apps/otya-player/security" className="px-4 py-2 rounded-xl border text-xs font-semibold" style={{ borderColor: 'var(--cosmos-divider)' }}>Security</Link>
        </div>
      </section>
    </main>

    <SiteFooter />
  </div>
}
