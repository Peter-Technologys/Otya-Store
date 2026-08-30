'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

type Track = {
  id: string
  title: string
  artist: string
  album: string
  artwork: string
  durationSeconds: number
  streamUrl: string
  downloadAllowed: boolean
  downloadUrl: string
  shareUrl: string
  licenseUrl: string
  provider: string
}

type MusicResponse = {
  ok?: boolean
  tracks?: Track[]
  error?: string
}

export default function MusicPage() {
  const [query, setQuery] = useState('')
  const [tracks, setTracks] = useState<Track[]>([])
  const [current, setCurrent] = useState<Track | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const audioRef = useRef<HTMLAudioElement>(null)

  async function loadMusic(nextQuery = '') {
    setLoading(true)
    setMessage('')
    try {
      const url = new URL('/api/music/jamendo', window.location.origin)
      if (nextQuery.trim()) url.searchParams.set('q', nextQuery.trim())
      url.searchParams.set('limit', '24')
      const response = await fetch(url, { headers: { Accept: 'application/json' } })
      const data = await response.json().catch(() => ({})) as MusicResponse
      if (!response.ok || data.ok === false) throw new Error(data.error || 'Online music is unavailable right now.')
      setTracks(Array.isArray(data.tracks) ? data.tracks : [])
      if (!data.tracks?.length) setMessage(nextQuery ? 'No online matches found.' : 'No online tracks are available right now.')
    } catch (error) {
      setTracks([])
      setMessage((error as Error).message || 'Online music is unavailable right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const initial = params.get('q') || ''
    setQuery(initial)
    void loadMusic(initial)
  }, [])

  function submit(event: FormEvent) {
    event.preventDefault()
    const next = query.trim()
    const url = next ? `/music?q=${encodeURIComponent(next)}` : '/music'
    window.history.replaceState(null, '', url)
    void loadMusic(next)
  }

  async function play(track: Track) {
    setCurrent(track)
    requestAnimationFrame(() => {
      audioRef.current?.play().catch(() => undefined)
    })
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
      <SiteNav />
      <main className="flex-1">
        <div className="otya-shell py-10 sm:py-14">
          <header className="max-w-2xl mb-7">
            <div className="otya-kicker mb-3">OTYA · Music</div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-[-.045em]">Your music, plus online discovery.</h1>
            <p className="mt-3 text-sm sm:text-base otya-muted max-w-xl">
              Search and play provider-authorized music online. OTYA remains an offline-first local player; this page is an optional online enhancement.
            </p>
          </header>

          <form onSubmit={submit} className="max-w-2xl flex gap-2 mb-8">
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search tracks or artists"
              aria-label="Search online music"
              className="min-h-12 flex-1 rounded-xl border px-4 outline-none"
              style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)', color: 'var(--cosmos-text-primary)' }}
            />
            <button className="cosmos-button min-h-12 rounded-xl px-5 font-bold text-sm" disabled={loading}>Search</button>
          </form>

          {current && (
            <section className="mb-8 rounded-2xl border p-4 sm:p-5" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-surface)' }}>
              <div className="grid sm:grid-cols-[84px_1fr] gap-4 items-center">
                <div className="w-20 h-20 rounded-xl overflow-hidden" style={{ background: 'var(--cosmos-card)' }}>
                  {current.artwork ? <img src={current.artwork} alt="" className="w-full h-full object-cover" /> : null}
                </div>
                <div className="min-w-0">
                  <div className="otya-kicker mb-1">Now playing</div>
                  <h2 className="font-black truncate">{current.title}</h2>
                  <p className="text-sm otya-muted truncate">{current.artist || 'Unknown artist'}</p>
                  <audio ref={audioRef} src={current.streamUrl} controls className="w-full mt-3" preload="none" />
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                    {current.shareUrl && <a href={current.shareUrl} target="_blank" rel="noreferrer" className="font-semibold">Artist / track on Jamendo ↗</a>}
                    {current.licenseUrl && <a href={current.licenseUrl} target="_blank" rel="noreferrer" className="otya-muted">License ↗</a>}
                    {current.downloadAllowed && current.downloadUrl && <a href={current.downloadUrl} target="_blank" rel="noreferrer" className="font-semibold">Download ↗</a>}
                  </div>
                </div>
              </div>
            </section>
          )}

          <section>
            <div className="flex items-end justify-between gap-4 mb-4">
              <div>
                <div className="otya-kicker mb-1">Online results</div>
                <h2 className="text-xl font-black">{query.trim() ? `Matches for “${query.trim()}”` : 'Discover'}</h2>
              </div>
              <Link href="/docs/online-music" className="text-sm font-semibold otya-muted">How this works →</Link>
            </div>

            {loading ? (
              <div className="py-12 text-sm otya-muted">Loading online music…</div>
            ) : message ? (
              <div className="rounded-2xl border p-5 text-sm otya-muted" style={{ borderColor: 'var(--cosmos-divider)' }}>{message}</div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--cosmos-divider)' }}>
                {tracks.map(track => (
                  <article key={track.id} className="grid grid-cols-[54px_minmax(0,1fr)_auto] gap-3 py-3 items-center">
                    <button onClick={() => void play(track)} className="w-12 h-12 rounded-lg overflow-hidden text-left" aria-label={`Play ${track.title}`} style={{ background: 'var(--cosmos-card)' }}>
                      {track.artwork ? <img src={track.artwork} alt="" className="w-full h-full object-cover" /> : <span className="grid place-items-center w-full h-full">▶</span>}
                    </button>
                    <button onClick={() => void play(track)} className="min-w-0 text-left">
                      <div className="font-bold text-sm truncate">{track.title}</div>
                      <div className="text-xs otya-muted truncate">{track.artist || 'Unknown artist'}{track.album ? ` · ${track.album}` : ''}</div>
                    </button>
                    <div className="flex items-center gap-2 text-xs">
                      <button onClick={() => void play(track)} className="otya-quiet-button rounded-lg px-3 py-2 font-semibold">Play</button>
                      {track.downloadAllowed && track.downloadUrl ? <a href={track.downloadUrl} target="_blank" rel="noreferrer" className="hidden sm:inline font-semibold">Download</a> : null}
                      {track.shareUrl ? <a href={track.shareUrl} target="_blank" rel="noreferrer" className="hidden sm:inline otya-muted">Source ↗</a> : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="mt-10 border-t pt-5 text-xs leading-relaxed otya-muted" style={{ borderColor: 'var(--cosmos-divider)' }}>
            Online tracks are supplied by third-party music providers and remain subject to the artist&apos;s license and provider terms. OTYA credits the creator/provider and links back to the provider. Download is shown only when the provider reports that downloading is allowed.
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
