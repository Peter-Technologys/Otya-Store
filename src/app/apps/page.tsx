import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Apps - PeterSmart Technologies',
  description: 'Android apps built by PeterSmart Technologies. OTYA Player - free offline media player for Android.',
}

export default function AppsPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <nav className="sticky top-0 z-50 border-b backdrop-blur-2xl" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.92)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/web-app-manifest-192x192.png" alt="PeterSmart Link" width={28} height={28} style={{ borderRadius: 8 }} />
            <span className="font-semibold text-sm hidden sm:block" style={{ color: 'var(--text)' }}>PeterSmart Link</span>
          </Link>
          <span style={{ color: 'var(--border)' }}>/</span>
          <span className="text-sm font-medium" style={{ color: 'var(--text-sub)' }}>Apps</span>
        </div>
      </nav>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-black mb-2" style={{ color: 'var(--text)' }}>Our Apps</h1>
          <p className="text-sm" style={{ color: 'var(--text-sub)' }}>Android apps built by PeterSmart Technologies.</p>
        </div>
        <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
              <Image src="/played-icon.png" alt="OTYA Player" width={72} height={72} style={{ borderRadius: 18, objectFit: 'cover', flexShrink: 0 }} />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-xl font-black" style={{ color: 'var(--text)' }}>OTYA Player</h2>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700">v1.4.0</span>
                </div>
                <p className="text-xs font-semibold mb-2" style={{ color: '#7c3aed' }}>Offline Media Player - Android - Free</p>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-sub)' }}>Free offline media player for Android. Play music and videos, share files via Flash Share, protect private media in an encrypted Vault, and stream your library to any PC browser on your Wi-Fi.</p>
                <div className="flex flex-wrap gap-2">
                  <a href="https://getotya.petersmartlink.com/download" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #7c3aedcc)' }}>Download APK</a>
                  <Link href="/apps/otya-player"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:border-purple-400"
                    style={{ borderColor: 'var(--border)', color: 'var(--purple)', background: 'var(--bg)' }}>Learn more</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
