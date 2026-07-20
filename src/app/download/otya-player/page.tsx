import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Download OTYA Player - Free Android App | PeterSmart Technologies',
  description: 'Download OTYA Player for free. Works on all Android phones.',
  alternates: { canonical: 'https://petersmartlink.com/download/otya-player' },
}

// Worker is on the same domain — use relative paths for API calls
const WORKER_BASE = 'https://petersmartlink.com'

async function getLatestVersion(): Promise<string> {
  try {
    const res = await fetch(`${WORKER_BASE}/version`, { next: { revalidate: 300 } })
    if (!res.ok) return '1.3.0'
    const data = await res.json()
    return data.version ?? '1.3.0'
  } catch { return '1.3.0' }
}

export default async function DownloadPage() {
  const version = await getLatestVersion()
  const apks = { arm64: `${WORKER_BASE}/apk/arm64`, arm32: `${WORKER_BASE}/apk/arm32` }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-20 h-20 rounded-[20px] overflow-hidden mb-5" style={{ boxShadow: '0 8px 32px rgba(138,43,226,0.35)' }}>
            <Image src="/played-icon.png" alt="OTYA Player" width={80} height={80} style={{ objectFit: 'cover' }} priority />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3 border border-purple-200 bg-purple-50 text-purple-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Version {version} - Free - Android
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2" style={{ color: 'var(--text)' }}>Download OTYA Player</h1>
          <p className="text-sm leading-relaxed max-w-md" style={{ color: 'var(--text-sub)' }}>Free offline music and video player. Works on <strong>all Android phones</strong>.</p>
        </div>
        <div className="rounded-2xl border p-6 mb-4" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
          <div className="grid grid-cols-2 gap-3">
            <a href={apks.arm64} className="flex flex-col items-center gap-2 px-4 py-4 rounded-xl text-white font-bold text-sm text-center" style={{ background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)' }}>
              Modern Phone<span className="font-normal text-xs opacity-80">Most phones (after 2015)</span>
            </a>
            <a href={apks.arm32} className="flex flex-col items-center gap-2 px-4 py-4 rounded-xl font-bold text-sm text-center border" style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--bg)' }}>
              Older Phone<span className="font-normal text-xs" style={{ color: 'var(--text-sub)' }}>Budget / pre-2015</span>
            </a>
          </div>
          <p className="text-xs text-center mt-3" style={{ color: 'var(--text-muted)' }}>If one says &quot;cannot install&quot;, try the other one.</p>
        </div>
        <div className="rounded-2xl border p-5" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
          <p className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>Need help installing?</p>
          <a href="https://wa.me/256775912582?text=Hi!+I+need+help+installing+OTYA+Player" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold mt-1" style={{ background: '#25d366' }}>Chat on WhatsApp</a>
        </div>
      </div>
    </div>
  )
}
