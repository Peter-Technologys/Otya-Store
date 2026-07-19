'use client'
import { useEffect, useState } from 'react'

type Abi = 'arm64' | 'arm32' | 'unknown'

function detectAbi(): Abi {
  const ua = navigator.userAgent
  if (/arm64|aarch64|armv8/i.test(ua)) return 'arm64'
  if (/armv7|armeabi/i.test(ua)) return 'arm32'
  if (/android/i.test(ua)) return 'arm64'
  return 'unknown'
}

export function DownloadButtons({ arm64Url, arm32Url }: { arm64Url: string; arm32Url: string }) {
  const [abi, setAbi] = useState<Abi>('unknown')
  const [downloaded, setDownloaded] = useState(false)

  useEffect(() => { setAbi(detectAbi()) }, [])

  const primaryUrl = abi === 'arm32' ? arm32Url : arm64Url
  const isAndroid = abi !== 'unknown'
  const phoneLabel = abi === 'arm32' ? 'Older / budget phone' : 'Modern phone (most phones)'

  function handleDownload(url: string) { window.location.href = url; setDownloaded(true) }

  return (
    <div className="rounded-2xl border p-6" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
      <button onClick={() => handleDownload(primaryUrl)}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-white font-bold text-base transition-all active:scale-95"
        style={{ background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)', boxShadow: '0 4px 20px rgba(138,43,226,0.4)' }}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
        {downloaded ? 'Download started! Check your notifications' : 'Download OTYA Player'}
      </button>
      <p className="text-center text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
        {isAndroid ? <>Detected: <span className="font-semibold" style={{ color: 'var(--text)' }}>{phoneLabel}</span></> : 'Open on your Android phone to download.'}
      </p>
      <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs text-center mb-3" style={{ color: 'var(--text-muted)' }}>Choose manually:</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => handleDownload(arm64Url)} className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl border text-xs font-semibold transition-all hover:border-purple-400" style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--bg)' }}>
            <span>Modern phone</span><span className="font-normal" style={{ color: 'var(--text-muted)' }}>Made after 2015</span>
          </button>
          <button onClick={() => handleDownload(arm32Url)} className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl border text-xs font-semibold transition-all hover:border-purple-400" style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--bg)' }}>
            <span>Older phone</span><span className="font-normal" style={{ color: 'var(--text-muted)' }}>Budget / pre-2015</span>
          </button>
        </div>
      </div>
    </div>
  )
}
