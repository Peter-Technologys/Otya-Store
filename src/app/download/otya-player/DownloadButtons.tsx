'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

type Abi = 'arm64' | 'arm32' | 'unknown'

type VersionData = {
  version?: string
  versionCode?: number
  date?: string
  changelog?: string
  downloads?: { arm64?: string; arm32?: string; auto?: string }
}

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: {
        sitekey: string
        theme?: 'dark' | 'light' | 'auto'
        size?: 'normal' | 'compact' | 'flexible'
        callback: (token: string) => void
        'expired-callback'?: () => void
        'error-callback'?: () => void
      }) => string
    }
  }
}

function detectAbi(): Abi {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  if (/arm64|aarch64|armv8/i.test(ua)) return 'arm64'
  if (/armv7|armeabi/i.test(ua)) return 'arm32'
  return /android/i.test(ua) ? 'arm64' : 'unknown'
}

export function DownloadPageClient() {
  const [abi, setAbi] = useState<Abi>('unknown')
  const [release, setRelease] = useState<VersionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<'idle' | 'verifying' | 'started'>('idle')
  const [protection, setProtection] = useState<{ enabled: boolean; siteKey: string | null }>({ enabled: false, siteKey: null })
  const [turnstileToken, setTurnstileToken] = useState('')
  const [error, setError] = useState('')
  const turnstileHost = useRef<HTMLDivElement>(null)
  const rendered = useRef(false)

  useEffect(() => {
    setAbi(detectAbi())
    Promise.allSettled([
      fetch('/latest', { cache: 'no-store' })
        .then(r => r.ok ? r.json() as Promise<VersionData> : Promise.reject(r.status))
        .then(setRelease),
      fetch('/api/download/config', { cache: 'no-store' })
        .then(r => r.ok ? r.json() as Promise<{ turnstile?: boolean; siteKey?: string | null }> : Promise.reject(r.status))
        .then(config => setProtection({ enabled: Boolean(config.turnstile && config.siteKey), siteKey: config.siteKey ?? null })),
    ]).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!protection.enabled || !protection.siteKey || rendered.current) return

    const renderWidget = () => {
      if (!turnstileHost.current || !window.turnstile || rendered.current || !protection.siteKey) return
      window.turnstile.render(turnstileHost.current, {
        sitekey: protection.siteKey,
        theme: 'auto',
        size: 'flexible',
        callback: token => { setTurnstileToken(token); setError('') },
        'expired-callback': () => setTurnstileToken(''),
        'error-callback': () => { setTurnstileToken(''); setError('Verification could not load. Try again.') },
      })
      rendered.current = true
    }

    if (window.turnstile) {
      renderWidget()
      return
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-otya-turnstile]')
    if (existing) {
      existing.addEventListener('load', renderWidget, { once: true })
      return () => existing.removeEventListener('load', renderWidget)
    }

    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.dataset.otyaTurnstile = 'true'
    script.addEventListener('load', renderWidget, { once: true })
    document.head.appendChild(script)
    return () => script.removeEventListener('load', renderWidget)
  }, [protection])

  const isAndroid = abi !== 'unknown'
  const fallbackUrl = abi === 'arm32' ? '/apk/arm32' : '/apk/arm64'
  const directUrl = abi === 'arm32'
    ? release?.downloads?.arm32 ?? fallbackUrl
    : release?.downloads?.arm64 ?? release?.downloads?.auto ?? fallbackUrl

  async function download() {
    setError('')
    if (!isAndroid) {
      setError('Open this page on a supported Android phone to download OTYA.')
      return
    }

    if (!protection.enabled) {
      setStatus('started')
      window.location.assign(directUrl)
      return
    }

    if (!turnstileToken) {
      setError('Complete the verification before downloading.')
      return
    }

    setStatus('verifying')
    try {
      const response = await fetch('/api/download/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: turnstileToken, abi: abi === 'arm32' ? 'arm32' : 'arm64' }),
      })
      const body = await response.json() as { ok?: boolean; url?: string; error?: string }
      if (!response.ok || !body.ok || !body.url) throw new Error(body.error || 'Verification failed.')
      setStatus('started')
      window.location.assign(body.url)
    } catch (cause) {
      setStatus('idle')
      setTurnstileToken('')
      setError(cause instanceof Error ? cause.message : 'Download verification failed.')
    }
  }

  return <div className="min-h-screen flex flex-col" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
    <SiteNav />
    <main className="flex-1">
      <section className="border-b" style={{ borderColor: 'var(--cosmos-divider)' }}>
        <div className="otya-shell py-14 sm:py-20 grid lg:grid-cols-[1fr_.8fr] gap-10 lg:gap-16 items-start">
          <div>
            <div className="flex items-center gap-4 mb-8">
              <Image src="/web-app-manifest-192x192.png" alt="OTYA" width={68} height={68} className="rounded-[20px]" priority />
              <div>
                <div className="otya-kicker mb-1">PeterSmart Link</div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-[-.04em]">OTYA</h1>
              </div>
            </div>
            <h2 className="text-4xl sm:text-6xl font-black tracking-[-.05em] leading-[1] max-w-2xl">Your media.<br/>Ready offline.</h2>
            <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed otya-muted">Play local video and music, transfer nearby files, keep selected media private, search your library and use local media tools. Core playback does not require an account or internet connection.</p>
            <div className="grid sm:grid-cols-3 gap-3 mt-8 max-w-2xl">
              <Feature title="Offline first" body="Local playback stays available without internet." />
              <Feature title="Android controls" body="Background audio, headset and lock-screen controls." />
              <Feature title="Local privacy" body="Your local media is not uploaded just to play it." />
            </div>
          </div>

          <aside className="modern-card p-5 sm:p-6 lg:sticky lg:top-24">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="otya-kicker">Official release</div>
                <div className="font-black text-xl mt-1">{loading ? 'Checking…' : release?.version ? `OTYA ${release.version}` : 'OTYA for Android'}</div>
                {release?.date && <div className="text-xs mt-1 otya-muted">Released {release.date}</div>}
              </div>
              {release?.version && <span className="rounded-full border px-2.5 py-1 text-[10px] font-bold" style={{ borderColor: 'var(--cosmos-divider)', color: 'var(--cosmos-primary)' }}>LATEST</span>}
            </div>

            {release?.changelog && <div className="mt-5 pt-5 border-t" style={{ borderColor: 'var(--cosmos-divider)' }}>
              <div className="text-xs font-bold mb-2">What changed</div>
              <p className="text-xs leading-relaxed otya-muted whitespace-pre-line">{release.changelog}</p>
            </div>}

            <div className="mt-5 pt-5 border-t" style={{ borderColor: 'var(--cosmos-divider)' }}>
              {isAndroid ? <>
                {protection.enabled && <div className="mb-4"><div ref={turnstileHost} /></div>}
                <button type="button" disabled={status === 'verifying'} onClick={download} className="cosmos-button w-full rounded-xl px-5 py-3.5 text-sm font-bold disabled:opacity-60">
                  {status === 'verifying' ? 'Verifying…' : status === 'started' ? 'Download started' : `Download${release?.version ? ` · v${release.version}` : ''}`}
                </button>
                <p className="text-[11px] mt-3 text-center otya-muted">OTYA selects the appropriate ARM build from the official release storage.</p>
              </> : <div className="rounded-xl border p-4 text-center" style={{ borderColor: 'var(--cosmos-divider)' }}>
                <div className="font-semibold text-sm">Android download</div>
                <p className="text-xs mt-1.5 otya-muted">Open this page on a supported Android phone. OTYA currently distributes ARM Android builds.</p>
              </div>}
              {error && <p className="text-xs mt-3 text-center" style={{ color: 'var(--cosmos-error)' }}>{error}</p>}
            </div>
          </aside>
        </div>
      </section>

      <section className="otya-shell py-12 sm:py-16 grid md:grid-cols-2 gap-5">
        <Info title="First launch" text="OTYA explains the media and notification permissions it actually needs. Denying online services never blocks local playback." />
        <Info title="Need help?" text="Use OTYA Support for installation, permissions, playback, Transfer, Private and update troubleshooting." href="/apps/otya-player/support" />
      </section>
    </main>
    <SiteFooter />
  </div>
}

function Feature({ title, body }: { title: string; body: string }) {
  return <div className="modern-card p-4"><div className="text-sm font-bold">{title}</div><p className="text-xs mt-1 leading-relaxed otya-muted">{body}</p></div>
}

function Info({ title, text, href }: { title: string; text: string; href?: string }) {
  return <div className="modern-card p-6"><div className="otya-kicker mb-2">{title}</div><p className="text-sm leading-relaxed otya-muted">{text}</p>{href && <a href={href} className="inline-block text-sm font-semibold mt-4">Open support →</a>}</div>
}
