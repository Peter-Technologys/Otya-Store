import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Otya Player - Offline Media Player | PeterSmart Technologies',
  description: 'Otya Player - high-performance offline media player for Android. Flash Share, AES-256 Vault, hardware-accelerated video, synced lyrics.',
  alternates: { canonical: 'https://petersmartlink.com/apps/played/' },
}

export default function PlayedPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <nav className="sticky top-0 z-50 border-b backdrop-blur-2xl" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.92)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-2 text-sm">
          <Link href="/" className="font-medium hover:text-purple-600" style={{ color: 'var(--text-sub)' }}>PeterSmart Link</Link>
          <span style={{ color: 'var(--border)' }}>/</span>
          <Link href="/apps" className="font-medium hover:text-purple-600" style={{ color: 'var(--text-sub)' }}>Apps</Link>
          <span style={{ color: 'var(--border)' }}>/</span>
          <span className="font-semibold" style={{ color: 'var(--text)' }}>Otya Player</span>
        </div>
      </nav>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-10">
          <Image src="/played-icon.png" alt="Otya Player" width={88} height={88} style={{ borderRadius: 22, objectFit: 'cover', flexShrink: 0 }} />
          <div>
            <h1 className="text-3xl sm:text-4xl font-black mb-1" style={{ color: 'var(--text)' }}>Otya Player</h1>
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--purple)' }}>Offline Media Player - Android - by PeterSmart Technologies</p>
            <p className="text-sm leading-relaxed mb-5 max-w-lg" style={{ color: 'var(--text-sub)' }}>High-performance offline media player. 100% offline-first. Built for Android 5+.</p>
            <div className="flex flex-wrap gap-2">
              <a href="https://getotya.petersmartlink.com/download" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-semibold text-sm"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>Download APK</a>
              <Link href="/apps/played/privacy" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border hover:border-purple-400" style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--card)' }}>Privacy Policy</Link>
              <Link href="/apps/played/terms" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border hover:border-purple-400" style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--card)' }}>Terms</Link>
            </div>
          </div>
        </div>
        <div className="mt-6 text-center">
          <Link href="/apps" className="text-sm font-semibold" style={{ color: 'var(--purple)' }}>Back to all apps</Link>
        </div>
      </div>
    </div>
  )
}
