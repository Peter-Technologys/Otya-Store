import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Otya Player - Offline Media Player | PeterSmart Technologies',
  description: 'Otya Player - high-performance offline media player for Android. Flash Share, AES-256 Vault, hardware-accelerated video, synced lyrics.',
  alternates: { canonical: 'https://petersmartlink.com/apps/otya-player/' },
}

export default function OtyaPlayerPage() {
  return (
    <div className="min-h-screen relative" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
      <div className="cosmos-stars" />
      <nav className="sticky top-0 z-50 border-b backdrop-blur-2xl" style={{ borderColor: 'var(--cosmos-divider)', background: 'rgba(2,2,8,0.92)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-2 text-sm">
          <Link href="/" className="font-medium hover:text-purple-400 transition-colors" style={{ color: 'var(--cosmos-text-secondary)' }}>PeterSmart Link</Link>
          <span style={{ color: 'var(--cosmos-divider)' }}>/</span>
          <Link href="/apps" className="font-medium hover:text-purple-400 transition-colors" style={{ color: 'var(--cosmos-text-secondary)' }}>Apps</Link>
          <span style={{ color: 'var(--cosmos-divider)' }}>/</span>
          <span className="font-semibold" style={{ color: 'var(--cosmos-text-primary)' }}>Otya Player</span>
        </div>
      </nav>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 relative z-10">
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-10">
          <div className="relative flex-shrink-0" style={{ animation: 'cosmos-glow 4s infinite' }}>
            <div className="absolute inset-0 rounded-[22px] blur-xl opacity-60" style={{ background: 'linear-gradient(135deg, var(--cosmos-primary), var(--cosmos-accent))' }} />
            <Image src="/played-icon.png" alt="Otya Player" width={88} height={88} style={{ borderRadius: 22, objectFit: 'cover', flexShrink: 0, position: 'relative', border: '2px solid rgba(123,97,255,0.4)' }} />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black mb-1 cosmos-gradient-text">Otya Player</h1>
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--cosmos-primary)' }}>Offline Media Player - Android - by PeterSmart Technologies</p>
            <p className="text-sm leading-relaxed mb-5 max-w-lg" style={{ color: 'var(--cosmos-text-secondary)' }}>High-performance offline media player. 100% offline-first. Built for Android 5+.</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/download/otya-player"
                className="cosmos-button inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition-transform">Download APK</Link>
              <Link href="/apps/otya-player/privacy" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors hover:border-purple-400" style={{ borderColor: 'var(--cosmos-divider)', color: 'var(--cosmos-text-primary)', background: 'var(--cosmos-card)' }}>Privacy Policy</Link>
              <Link href="/apps/otya-player/terms" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors hover:border-purple-400" style={{ borderColor: 'var(--cosmos-divider)', color: 'var(--cosmos-text-primary)', background: 'var(--cosmos-card)' }}>Terms</Link>
              <Link href="/apps/otya-player/changelog" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors hover:border-purple-400" style={{ borderColor: 'var(--cosmos-divider)', color: 'var(--cosmos-text-primary)', background: 'var(--cosmos-card)' }}>Changelog</Link>
              <Link href="/apps/otya-player/support" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors hover:border-purple-400" style={{ borderColor: 'var(--cosmos-divider)', color: 'var(--cosmos-text-primary)', background: 'var(--cosmos-card)' }}>Support</Link>
            </div>
          </div>
        </div>
        <div className="mt-6 text-center">
          <Link href="/apps" className="text-sm font-semibold hover:text-purple-400 transition-colors" style={{ color: 'var(--cosmos-primary)' }}>Back to all apps</Link>
        </div>
      </div>
    </div>
  )
}