import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'OTYA Player — Free Offline Media Player for Android',
  description: 'OTYA Player is a free offline media player for Android built in Uganda. Play music and videos offline, share files via Flash Share, protect media in an encrypted Vault, and stream to any PC browser on Wi-Fi.',
  alternates: { canonical: 'https://petersmartlink.com/otya-player' },
}

const WA = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'

const FEATURES = [
  { emoji: '🎵', label: 'Audio Player', items: ['MP3, AAC, FLAC, OGG, M4A', 'Background playback with lock-screen controls', 'Shuffle, repeat, queue management', 'Speed control 0.5x–2.0x, sleep timer, 5-band EQ, synced lyrics'] },
  { emoji: '🎬', label: 'Video Player', items: ['MP4, MKV, AVI, MOV, WebM', 'Hardware-accelerated, smooth playback', 'Gesture controls, Picture-in-Picture, subtitles', 'Double-tap to seek ±10 seconds'] },
  { emoji: '🔒', label: 'Private Vault', items: ['AES-256 encryption', 'Fingerprint + PIN unlock', 'Files hidden from gallery and other apps', 'Extra security layer on file headers'] },
  { emoji: '⚡', label: 'Flash Share', items: ['Send files phone-to-phone over Wi-Fi', 'No internet required', 'QR code connect, real-time progress'] },
  { emoji: '🌐', label: 'Web Mirror', items: ['Stream your library to any PC browser on Wi-Fi', 'No cables needed', 'Search, stream, download from browser'] },
  { emoji: '📊', label: 'Storage Analyzer', items: ['See what is using your storage', 'Clear cache in one tap', 'Auto-refresh when files change'] },
]

const SPECS = [
  { label: 'Platform', value: 'Android 5.0+' },
  { label: 'Size', value: '~35 MB' },
  { label: 'Price', value: 'Free forever' },
  { label: 'Internet', value: 'Not required' },
  { label: 'Ads', value: 'Minimal' },
  { label: 'Developer', value: 'PeterSmart Technologies' },
]

export default function OtyaPlayerPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <SiteNav />

      {/* Hero */}
      <section className="border-b" style={{ borderColor: 'var(--border)', background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0a2e 50%, #0a1628 100%)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="flex flex-col sm:flex-row items-center gap-10">
            <div className="flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-5 border border-purple-500/30 bg-purple-500/10 text-purple-300">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Latest · v1.4.0 · Free · Android 5.0+
              </div>
              <h1 className="text-5xl sm:text-6xl font-black mb-4 leading-tight text-white">
                OTYA<br />
                <span style={{ background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Player</span>
              </h1>
              <p className="text-base leading-relaxed mb-3 max-w-lg text-slate-300">
                The offline media player built in Uganda. Play any music or video without internet, share files phone-to-phone, lock private media in an encrypted vault, and stream your library to any PC browser on Wi-Fi.
              </p>
              <p className="text-sm mb-8 text-slate-500">by <span className="text-purple-400 font-semibold">PeterSmart Technologies</span> · Mbirizi, Uganda</p>
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                <Link href="/download/otya-player"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)', boxShadow: '0 4px 24px rgba(138,43,226,0.4)' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download Free APK
                </Link>
                <a href="https://wa.me/256775912582?text=Hi! I need help with OTYA Player" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white" style={{ background: '#25d366' }}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d={WA} /></svg>
                  WhatsApp Support
                </a>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="relative w-44 h-44 sm:w-56 sm:h-56">
                <div className="absolute inset-0 rounded-[32px] blur-3xl opacity-50" style={{ background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)' }} />
                <div className="relative w-full h-full rounded-[32px] overflow-hidden" style={{ boxShadow: '0 24px 64px rgba(138,43,226,0.5)' }}>
                  <Image src="/played-icon.png" alt="OTYA Player" fill style={{ objectFit: 'cover' }} priority />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12">

        {/* Quick specs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {SPECS.map(s => (
            <div key={s.label} className="p-3 rounded-2xl border text-center" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
              <div className="text-xs font-bold mb-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              <div className="text-sm font-black" style={{ color: 'var(--text)' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div>
          <h2 className="text-2xl font-black mb-6" style={{ color: 'var(--text)' }}>Everything you need, offline</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div key={f.label} className="p-5 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{f.emoji}</span>
                  <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{f.label}</span>
                </div>
                <ul className="space-y-1.5">
                  {f.items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-sub)' }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[5px]" style={{ background: '#8A2BE2' }} />{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Download CTA */}
        <div className="rounded-2xl p-8 text-center" style={{ background: 'linear-gradient(135deg, #0f0a1e, #1a0a2e)' }}>
          <Image src="/played-icon.png" alt="OTYA Player" width={64} height={64}
            className="rounded-2xl mx-auto mb-4" style={{ display: 'block', boxShadow: '0 8px 32px rgba(138,43,226,0.4)' }} />
          <h3 className="text-2xl font-black text-white mb-2">Download OTYA Player</h3>
          <p className="text-sm text-slate-400 mb-6">Free. No subscription. No internet required. Works on all Android phones.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/download/otya-player"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download APK
            </Link>
            <Link href="/apps/otya-player/changelog"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border border-white/20 text-slate-300 hover:border-purple-400">
              Changelog
            </Link>
          </div>
        </div>

        {/* Legal links */}
        <div className="rounded-2xl border p-5" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
          <h3 className="font-bold text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Legal & Support</h3>
          <div className="flex flex-wrap gap-2">
            {([
              ['Privacy Policy', '/apps/otya-player/privacy'],
              ['Terms of Service', '/apps/otya-player/terms'],
              ['Support & FAQ', '/apps/otya-player/support'],
            ] as [string, string][]).map(([l, h]) => (
              <Link key={l} href={h}
                className="px-4 py-2 rounded-xl text-sm font-medium border hover:border-purple-400 transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--bg)' }}>{l}</Link>
            ))}
          </div>
        </div>

        <div className="text-center pb-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--purple)' }}>
            ← Back to PeterSmart Technologies
          </Link>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
