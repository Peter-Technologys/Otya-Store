import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Download OTYA Player — Free Android App',
  description: 'Download OTYA Player for free. Works on all Android phones. Free offline music and video player built in Uganda.',
  alternates: { canonical: 'https://petersmartlink.com/download/otya-player' },
}

const WORKER_BASE = 'https://petersmartlink.com'

async function getLatestVersion(): Promise<string> {
  try {
    const res = await fetch(`${WORKER_BASE}/version`, { next: { revalidate: 300 } })
    if (!res.ok) return '1.3.3'
    const data = await res.json()
    return data.version ?? '1.3.3'
  } catch { return '1.3.3' }
}

export default async function DownloadPage() {
  const version = await getLatestVersion()
  const apks = {
    arm64: `${WORKER_BASE}/apk/arm64`,
    arm32: `${WORKER_BASE}/apk/arm32`,
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b backdrop-blur-2xl" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.92)' }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-medium text-sm hover:text-purple-600" style={{ color: 'var(--text-sub)' }}>← Home</Link>
          <Link href="/apps/otya-player" className="text-sm font-semibold" style={{ color: 'var(--purple)' }}>About OTYA Player</Link>
        </div>
      </nav>

      <div className="max-w-md mx-auto px-4 py-10">

        {/* App identity */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 rounded-[20px] overflow-hidden mb-4" style={{ boxShadow: '0 8px 32px rgba(138,43,226,0.35)' }}>
            <Image src="/played-icon.png" alt="OTYA Player" width={80} height={80} className="w-full h-full object-cover" priority />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-2 border border-purple-200 bg-purple-50 text-purple-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            v{version} · Free · Android
          </div>
          <h1 className="text-2xl font-black mb-1" style={{ color: 'var(--text)' }}>Download OTYA Player</h1>
          <p className="text-sm" style={{ color: 'var(--text-sub)' }}>Free offline music and video player. Works on <strong>all Android phones</strong>.</p>
        </div>

        {/* Download buttons */}
        <div className="rounded-2xl border p-5 mb-4" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
          <p className="text-xs font-bold mb-3 text-center" style={{ color: 'var(--text-muted)' }}>CHOOSE YOUR PHONE TYPE</p>
          <div className="grid grid-cols-2 gap-3">
            <a href={apks.arm64}
              className="flex flex-col items-center gap-1.5 px-4 py-4 rounded-xl text-white font-bold text-sm text-center"
              style={{ background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Modern Phone
              <span className="font-normal text-xs opacity-80">Most phones (2015+)</span>
            </a>
            <a href={apks.arm32}
              className="flex flex-col items-center gap-1.5 px-4 py-4 rounded-xl font-bold text-sm text-center border"
              style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--bg)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Older Phone
              <span className="font-normal text-xs" style={{ color: 'var(--text-sub)' }}>Budget / pre-2015</span>
            </a>
          </div>
          <p className="text-xs text-center mt-3" style={{ color: 'var(--text-muted)' }}>If one says &quot;cannot install&quot;, try the other one.</p>
        </div>

        {/* Help */}
        <div className="rounded-2xl border p-4 mb-4" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
          <p className="text-sm font-bold mb-2" style={{ color: 'var(--text)' }}>Need help installing?</p>
          <div className="flex flex-wrap gap-2">
            <a href="https://wa.me/256775912582?text=Hi!+I+need+help+installing+OTYA+Player" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold" style={{ background: '#25d366' }}>Chat on WhatsApp</a>
            <Link href="/apps/otya-player/support"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border"
              style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--bg)' }}>Support & FAQ</Link>
          </div>
        </div>

        {/* PeterSmart Link footer brand */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <div className="w-6 h-6 rounded-md overflow-hidden">
            <Image src="/web-app-manifest-192x192.png" alt="PeterSmart Link" width={24} height={24} className="w-full h-full object-cover" />
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>by PeterSmart Technologies, Mbirizi Uganda</span>
        </div>
      </div>
    </div>
  )
}
