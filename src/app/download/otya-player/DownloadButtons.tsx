'use client'

import { useEffect, useMemo, useState } from 'react'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

type Abi = 'arm64' | 'arm32' | 'unknown'

interface VersionEntry {
  version: string
  date?: string
  changes: string[]
  arm64?: string | null
  arm32?: string | null
}

interface VersionData {
  version: string
  versionCode: number
  date?: string
  changelog?: string
  changes?: string[]
  history?: VersionEntry[]
}

function detectAbi(): Abi {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  if (/arm64|aarch64|armv8/i.test(ua)) return 'arm64'
  if (/armv7|armeabi/i.test(ua)) return 'arm32'
  if (/android/i.test(ua)) return 'arm64'
  return 'unknown'
}

function BrandMark() {
  return (
    <div
      className="h-[72px] w-[72px] rounded-[22px] flex items-center justify-center border shadow-2xl"
      style={{
        borderColor: 'rgba(139,92,246,.35)',
        background: 'linear-gradient(145deg, rgba(139,92,246,.18), rgba(17,17,24,.96))',
        boxShadow: '0 18px 50px rgba(80,45,160,.22)',
      }}
      aria-label="OTYA Player"
    >
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
        <circle cx="17" cy="17" r="15" stroke="#A78BFA" strokeWidth="2" opacity=".85" />
        <path d="M14 11.5L24 17L14 22.5V11.5Z" fill="#F7F5FF" />
      </svg>
    </div>
  )
}

export function DownloadPageClient() {
  const [abi, setAbi] = useState<Abi>('unknown')
  const [status, setStatus] = useState<'idle' | 'started'>('idle')
  const [vdata, setVdata] = useState<VersionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setAbi(detectAbi())
    fetch('/version', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() as Promise<VersionData> : Promise.reject(r.status)))
      .then(setVdata)
      .catch(() => setVdata(null))
      .finally(() => setLoading(false))
  }, [])

  const isAndroid = abi !== 'unknown'
  const latestUrl = abi === 'arm32' ? '/apk/arm32' : '/apk/arm64'
  const latestVer = vdata?.version ?? ''
  const latestDate = vdata?.date ?? ''

  const history = useMemo<VersionEntry[]>(() => {
    if (vdata?.history?.length) return vdata.history
    if (!vdata) return []
    return [{
      version: vdata.version,
      date: vdata.date,
      changes: vdata.changes ?? (vdata.changelog ? [vdata.changelog] : []),
      arm64: '/apk/arm64',
      arm32: '/apk/arm32',
    }]
  }, [vdata])

  function handleDownload(url: string) {
    setStatus('started')
    window.location.assign(url)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
      <SiteNav />

      <main className="flex-1">
        <section className="border-b" style={{ borderColor: 'var(--cosmos-divider)' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <div className="grid lg:grid-cols-[1fr_.86fr] gap-12 items-start">
              <div>
                <div className="flex items-center gap-4 mb-9">
                  <BrandMark />
                  <div>
                    <p className="text-xs uppercase tracking-[.2em] font-semibold mb-1" style={{ color: 'var(--cosmos-primary)' }}>PeterSmart Link</p>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight">OTYA Player</h1>
                  </div>
                </div>

                <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.02] max-w-2xl">
                  Your media.<br />Ready anywhere.
                </h2>
                <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed" style={{ color: 'var(--cosmos-text-secondary)' }}>
                  A private, offline-first Android player for music, video and useful media tools. No subscription required.
                </p>

                <div className="grid sm:grid-cols-3 gap-3 mt-8 max-w-2xl">
                  {[
                    ['Offline first', 'Play without internet'],
                    ['System controls', 'Lock screen + headset'],
                    ['Private', 'Local media stays local'],
                  ].map(([title, body]) => (
                    <div key={title} className="modern-card p-4">
                      <p className="font-bold text-sm">{title}</p>
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--cosmos-text-secondary)' }}>{body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="modern-card p-5 sm:p-6 lg:sticky lg:top-24">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div>
                    <p className="text-[11px] uppercase tracking-[.18em] font-bold" style={{ color: 'var(--cosmos-primary)' }}>Latest release</p>
                    <p className="font-black text-xl mt-1">{loading ? 'Checking…' : latestVer ? `Version ${latestVer}` : 'OTYA Player'}</p>
                  </div>
                  {!loading && latestVer && (
                    <span className="px-3 py-1.5 rounded-full text-[11px] font-bold border" style={{ borderColor: 'rgba(139,92,246,.28)', background: 'rgba(139,92,246,.10)', color: '#C4B5FD' }}>
                      CURRENT
                    </span>
                  )}
                </div>

                {latestDate && <p className="text-xs mb-5" style={{ color: 'var(--cosmos-text-secondary)' }}>Released {latestDate}</p>}

                {isAndroid ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDownload(latestUrl)}
                      className="cosmos-button w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm active:scale-[.98] transition-transform"
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.4" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14" />
                      </svg>
                      {status === 'started' ? 'Download started' : `Download for Android${latestVer ? ` · v${latestVer}` : ''}`}
                    </button>
                    <p className="text-center text-[11px] mt-3" style={{ color: 'var(--cosmos-text-secondary)' }}>
                      OTYA selects the compatible ARM build for this device.
                    </p>
                  </>
                ) : (
                  <div className="rounded-2xl border p-5 text-center" style={{ borderColor: 'var(--cosmos-divider)', background: 'rgba(255,255,255,.02)' }}>
                    <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(139,92,246,.12)', color: '#C4B5FD' }}>
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></svg>
                    </div>
                    <p className="text-sm font-bold">Open this page on Android</p>
                    <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--cosmos-text-secondary)' }}>The compatible APK download appears automatically on an Android phone.</p>
                  </div>
                )}

                <div className="mt-5 pt-5 border-t" style={{ borderColor: 'var(--cosmos-divider)' }}>
                  <div className="flex items-start gap-3">
                    <svg className="mt-0.5 flex-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" aria-hidden="true"><path d="M12 3l7 3v5c0 4.4-2.9 8.4-7 10-4.1-1.6-7-5.6-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></svg>
                    <div><p className="text-xs font-bold">Direct from PeterSmart Link</p><p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--cosmos-text-secondary)' }}>Release files are served from the official OTYA release storage.</p></div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="modern-card p-6">
              <p className="text-xs uppercase tracking-[.18em] font-bold mb-3" style={{ color: 'var(--cosmos-primary)' }}>First launch</p>
              <h3 className="text-xl font-black mb-3">OTYA guides the setup.</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--cosmos-text-secondary)' }}>
                On first install, OTYA explains media access and playback notifications before Android asks for permission. If your library is empty later, use OTYA Settings to review permissions and rescan—there is no need to enable broad “All Files Access” just to play normal music and video.
              </p>
            </div>

            <div className="modern-card p-6">
              <p className="text-xs uppercase tracking-[.18em] font-bold mb-3" style={{ color: 'var(--cosmos-primary)' }}>Support</p>
              <h3 className="text-xl font-black mb-3">Need help installing?</h3>
              <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--cosmos-text-secondary)' }}>Use the support page for installation, permissions, updates and playback troubleshooting.</p>
              <div className="flex flex-wrap gap-2">
                <a href="/apps/otya-player/support" className="px-4 py-2.5 rounded-xl border text-xs font-bold" style={{ borderColor: 'var(--cosmos-divider)' }}>Support &amp; FAQ</a>
                <a href="/contact" className="px-4 py-2.5 rounded-xl border text-xs font-bold" style={{ borderColor: 'var(--cosmos-divider)' }}>Contact PeterSmart Link</a>
              </div>
            </div>
          </div>

          {history.length > 0 && (
            <div className="mt-14">
              <div className="flex items-end justify-between gap-4 mb-5">
                <div><p className="text-xs uppercase tracking-[.18em] font-bold mb-2" style={{ color: 'var(--cosmos-primary)' }}>Releases</p><h2 className="text-2xl font-black">Version history</h2></div>
              </div>
              <div className="space-y-3">
                {history.map((v, i) => (
                  <div key={`${v.version}-${i}`} className="modern-card p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2"><span className="font-black">v{v.version}</span>{i === 0 && <span className="text-[10px] font-bold" style={{ color: '#A78BFA' }}>LATEST</span>}</div>
                      {v.date && <span className="text-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>{v.date}</span>}
                    </div>
                    {v.changes.length > 0 && <ul className="mt-4 space-y-2">{v.changes.map((change, j) => <li key={j} className="text-xs leading-relaxed flex gap-2" style={{ color: 'var(--cosmos-text-secondary)' }}><span style={{ color: '#A78BFA' }}>•</span><span>{change}</span></li>)}</ul>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
