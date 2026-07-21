'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type Abi = 'arm64' | 'arm32' | 'unknown'

function detectAbi(): Abi {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  if (/arm64|aarch64|armv8/i.test(ua)) return 'arm64'
  if (/armv7|armeabi/i.test(ua)) return 'arm32'
  if (/android/i.test(ua)) return 'arm64' // default modern for Android
  return 'unknown'
}

const VERSIONS = [
  {
    version: '1.3.0', date: 'July 2026',
    changes: [
      'Flash Share — share files phone-to-phone over Wi-Fi, no internet needed',
      'Web Mirror — stream your music to any PC browser on the same Wi-Fi',
      'Private Vault now hides files from gallery scanners',
      'Storage Analyzer — see what is using your storage, clear cache in one tap',
      'New AMOLED neon dark theme',
      'Seasonal themes: Christmas, Halloween, New Year',
      'Fixed: music stopping on Android 13+',
    ],
    arm64: null as string | null,
    arm32: null as string | null,
  },
  {
    version: '1.2.0', date: 'February 2026',
    changes: [
      'Private Vault — lock your private photos and videos with fingerprint or PIN',
      'Video player rebuilt — faster, smoother, supports more formats',
      'Equalizer with presets',
      'Car mode, skip silence, WhatsApp audio trimmer',
    ],
    arm64: '/apk/arm64?v=1.2.0',
    arm32: '/apk/arm32?v=1.2.0',
  },
  {
    version: '1.0.0', date: 'August 2025',
    changes: [
      'First release of OTYA Player',
      'Play music: MP3, AAC, FLAC, OGG, M4A',
      'Background playback with lock-screen controls',
      'Auto-scan your phone for all music and videos',
      'Dark, AMOLED, and Light themes',
    ],
    arm64: '/apk/arm64?v=1.0.0',
    arm32: '/apk/arm32?v=1.0.0',
  },
]

export function DownloadPageClient() {
  const [abi, setAbi] = useState<Abi>('unknown')
  const [status, setStatus] = useState<'idle' | 'started'>('idle')

  useEffect(() => { setAbi(detectAbi()) }, [])

  const isAndroid = abi !== 'unknown'
  const latestUrl = abi === 'arm32' ? '/apk/arm32' : '/apk/arm64'

  function handleDownload(url: string) {
    window.location.href = url
    setStatus('started')
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b backdrop-blur-2xl" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.92)' }}>
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-medium text-sm hover:text-purple-600" style={{ color: 'var(--text-sub)' }}>← Home</Link>
          <Link href="/apps/otya-player" className="text-sm font-semibold" style={{ color: 'var(--purple)' }}>About OTYA Player</Link>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-4 py-10 space-y-6">

        {/* App identity */}
        <div className="flex items-center gap-4">
          <Image src="/played-icon.png" alt="OTYA Player" width={72} height={72}
            className="rounded-[18px] flex-shrink-0" style={{ display: 'block', boxShadow: '0 8px 24px rgba(138,43,226,0.35)' }} priority />
          <div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>OTYA Player</h1>
            <p className="text-sm" style={{ color: 'var(--text-sub)' }}>Free · Offline · Android</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>by PeterSmart Technologies, Uganda</p>
          </div>
        </div>

        {/* Main download button — auto detected */}
        <div className="rounded-2xl border p-5" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>LATEST VERSION — v1.3.0 · July 2026</span>
          </div>

          {isAndroid ? (
            <>
              <button
                onClick={() => handleDownload(latestUrl)}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-white font-bold text-base transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)', boxShadow: '0 4px 20px rgba(138,43,226,0.4)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {status === 'started' ? 'Download started! Check notifications' : 'Download Free — v1.3.0'}
              </button>
              <p className="text-center text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                ✓ Best version for your phone selected automatically
              </p>
            </>
          ) : (
            <div className="text-center py-3">
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>Open this page on your Android phone</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>The download button will appear automatically</p>
            </div>
          )}
        </div>

        {/* Help */}
        <div className="rounded-2xl border p-4" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
          <p className="text-sm font-bold mb-3" style={{ color: 'var(--text)' }}>Need help installing?</p>
          <div className="flex flex-wrap gap-2">
            <a href="https://wa.me/256775912582?text=Hi!+I+need+help+installing+OTYA+Player"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold"
              style={{ background: '#25d366' }}>Chat on WhatsApp</a>
            <Link href="/apps/otya-player/support"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border"
              style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--bg)' }}>Support & FAQ</Link>
          </div>
        </div>

        {/* Changelog + older versions */}
        <div>
          <h2 className="text-base font-black mb-3" style={{ color: 'var(--text)' }}>Version History</h2>
          <div className="space-y-3">
            {VERSIONS.map((v, i) => (
              <div key={v.version} className="rounded-2xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
                {/* Version header */}
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm" style={{ color: 'var(--text)' }}>v{v.version}</span>
                    {i === 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">LATEST</span>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{v.date}</span>
                </div>

                {/* What changed */}
                <ul className="px-4 py-3 space-y-1.5">
                  {v.changes.map((c, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-sub)' }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[5px]" style={{ background: '#8A2BE2' }} />
                      {c}
                    </li>
                  ))}
                </ul>

                {/* Download older version */}
                {i > 0 && v.arm64 && isAndroid && (
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => handleDownload(abi === 'arm32' ? v.arm32! : v.arm64!)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all hover:border-purple-400"
                      style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--bg)' }}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download v{v.version}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer brand */}
        <div className="flex items-center justify-center gap-2 pb-4">
          <Image src="/web-app-manifest-192x192.png" alt="PeterSmart" width={20} height={20}
            className="rounded-md" style={{ display: 'block' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>by PeterSmart Technologies, Mbirizi Uganda</span>
        </div>

      </div>
    </div>
  )
}
