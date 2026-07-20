import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'OTYA Player — Offline Media Player for Android',
  description: 'OTYA Player is a free offline media player for Android. Play music and videos, manage playlists, share files via Flash Share, and protect private media in an encrypted vault.',
  alternates: { canonical: 'https://petersmartlink.com/apps/otya-player' },
}

const FEATURES = [
  { emoji: '🎵', label: 'Audio Player', items: ['MP3, AAC, FLAC, OGG, M4A', 'Background playback with lock-screen controls', 'Shuffle, repeat, queue management', 'Speed control (0.5x–2.0x), sleep timer, 5-band EQ, synced lyrics'] },
  { emoji: '🎬', label: 'Video Player', items: ['MP4, MKV, AVI, MOV, WebM', 'Hardware-accelerated via media_kit', 'Gesture controls, PiP, subtitles', 'Double-tap to seek ±10 seconds'] },
  { emoji: '🔒', label: 'Private Vault', items: ['AES-256 encryption', 'Biometric + PIN unlock', 'Files hidden from gallery and other apps'] },
  { emoji: '⚡', label: 'Flash Share', items: ['Device-to-device over Wi-Fi', 'No internet required', 'QR code connect, real-time progress'] },
  { emoji: '🌐', label: 'Web Mirror', items: ['Stream library to any PC browser on Wi-Fi', 'No cables needed', 'Search, stream, download from browser'] },
  { emoji: '📊', label: 'Storage Analyzer', items: ['Ring chart of usage', 'One-tap cache purge', 'Auto-refresh when files change'] },
]

export default function OtyaPlayerPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b backdrop-blur-2xl" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.92)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="font-medium hover:text-purple-600 text-sm" style={{ color: 'var(--text-sub)' }}>Home</Link>
            <span style={{ color: 'var(--border)' }}>/</span>
            <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>OTYA Player</span>
          </div>
          <Link href="/download/otya-player"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-semibold text-xs"
            style={{ background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)' }}>Download APK</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* App header */}
        <div className="flex flex-col sm:flex-row items-start gap-5 mb-8">
          <div className="w-20 h-20 rounded-[20px] overflow-hidden flex-shrink-0" style={{ boxShadow: '0 8px 32px rgba(138,43,226,0.4)' }}>
            <Image src="/played-icon.png" alt="OTYA Player" width={80} height={80} className="w-full h-full object-cover" priority />
          </div>
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-2 border border-purple-200 bg-purple-50 text-purple-700">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Latest Update · July 2026 · Free · Android 5.0+
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mb-1" style={{ color: 'var(--text)' }}>OTYA Player</h1>
            <p className="text-sm font-semibold mb-2" style={{ color: '#8A2BE2' }}>Offline Media Player · Android · by PeterSmart Technologies</p>
            <p className="text-sm leading-relaxed mb-4 max-w-xl" style={{ color: 'var(--text-sub)' }}>A free, offline-first media player for Android built in Uganda. Play music and videos without internet, share files device-to-device, protect private media in an encrypted vault, and stream your library to any PC browser on Wi-Fi.</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/download/otya-player"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-semibold text-sm"
                style={{ background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)' }}>Download APK (Free)</Link>
              <a href="https://wa.me/256775912582?text=Hi! I need help with OTYA Player" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-semibold text-sm" style={{ background: '#25d366' }}>WhatsApp Support</a>
              <Link href="/apps/otya-player/support"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border"
                style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--card)' }}>Support & FAQ</Link>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {FEATURES.map(f => (
            <div key={f.label} className="p-4 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
              <div className="flex items-center gap-2 mb-2"><span className="text-lg">{f.emoji}</span><span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{f.label}</span></div>
              <ul className="space-y-1">
                {f.items.map(item => (
                  <li key={item} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-sub)' }}>
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-[5px]" style={{ background: '#8A2BE2' }} />{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Legal */}
        <div className="rounded-2xl border p-4" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
          <h2 className="font-bold text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Legal & Support</h2>
          <div className="flex flex-wrap gap-2">
            {([['Privacy Policy', '/apps/otya-player/privacy'], ['Terms of Service', '/apps/otya-player/terms'], ['Support & FAQ', '/apps/otya-player/support'], ['Changelog', '/apps/otya-player/changelog']] as [string, string][]).map(([l, h]) => (
              <Link key={l} href={h} className="px-3 py-1.5 rounded-xl text-sm font-medium border hover:border-purple-400" style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--bg)' }}>{l}</Link>
            ))}
          </div>
        </div>

        <div className="mt-5 text-center">
          <Link href="/" className="text-sm font-semibold" style={{ color: '#8A2BE2' }}>← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
