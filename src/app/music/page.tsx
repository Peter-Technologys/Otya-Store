'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
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

type MusicResponse = { ok?: boolean; tracks?: Track[]; error?: string }

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return ''
  const minutes = Math.floor(seconds / 60)
  const rest = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${rest}`
}

export default function MusicPage() {
  const [query, setQuery] = useState('')
  const [tracks, setTracks] = useState<Track[]>([])
  const [current, setCurrent] = useState<Track | null>(null)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const audioRef = useRef<HTMLAudioElement>(null)

  async function loadMusic(nextQuery = '') {
    setLoading(true)
    setMessage('')
    try {
      const url = new URL('/api/music/jamendo', window.location.origin)
      if (nextQuery.trim()) url.searchParams.set('q', nextQuery.trim())
      url.searchParams.set('limit', '30')
      const response = await fetch(url, { headers: { Accept: 'application/json' } })
      const data = await response.json().catch(() => ({})) as MusicResponse
      if (!response.ok || data.ok === false) throw new Error(data.error || 'Music is unavailable right now.')
      const nextTracks = Array.isArray(data.tracks) ? data.tracks : []
      setTracks(nextTracks)
      if (!nextTracks.length) setMessage(nextQuery ? 'No matches found.' : 'No tracks are available right now.')
    } catch (error) {
      setTracks([])
      setMessage((error as Error).message || 'Music is unavailable right now.')
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
    window.history.replaceState(null, '', next ? `/music?q=${encodeURIComponent(next)}` : '/music')
    void loadMusic(next)
  }

  function play(track: Track) {
    const audio = audioRef.current
    if (!audio) return
    if (current?.id === track.id) {
      if (audio.paused) void audio.play().catch(() => setPlaying(false))
      else audio.pause()
      return
    }
    setCurrent(track)
    audio.src = track.streamUrl
    audio.load()
    void audio.play().catch(() => setPlaying(false))
  }

  const downloadHref = (track: Track) => `/api/music/jamendo/download/${encodeURIComponent(track.id)}`

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
      <SiteNav />
      <main className="flex-1 pb-28 sm:pb-32">
        <div className="otya-shell py-6 sm:py-9">
          <div className="max-w-4xl mb-5">
            <div className="otya-kicker mb-2">OTYA Music</div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-[-.045em]">Play what you find.</h1>
          </div>

          <form onSubmit={submit} className="sticky top-[57px] z-30 -mx-3 px-3 py-3 mb-6 backdrop-blur-xl sm:static sm:mx-0 sm:px-0 sm:py-0 sm:backdrop-blur-none" style={{ background: 'color-mix(in srgb, var(--cosmos-scaffold) 90%, transparent)' }}>
            <div className="max-w-4xl flex gap-2">
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search songs, artists or albums" aria-label="Search music" className="min-h-12 min-w-0 flex-1 rounded-xl border px-4 outline-none" style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)', color: 'var(--cosmos-text-primary)' }} />
              <button className="cosmos-button min-h-12 rounded-xl px-4 sm:px-5 font-bold text-sm shrink-0" disabled={loading}>{loading ? '…' : 'Search'}</button>
            </div>
          </form>

          <section>
            <div className="flex items-end justify-between gap-3 mb-3">
              <h2 className="text-xl sm:text-2xl font-black">{query.trim() ? `Results for “${query.trim()}”` : 'Discover'}</h2>
              <span className="text-xs otya-muted">Jamendo · more sources coming</span>
            </div>

            {loading ? (
              <div className="space-y-2">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-[72px] rounded-xl animate-pulse" style={{ background: 'var(--cosmos-card)' }} />)}</div>
            ) : message ? (
              <div className="rounded-2xl border p-5 text-sm otya-muted" style={{ borderColor: 'var(--cosmos-divider)' }}>{message}</div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--cosmos-divider)' }}>
                {tracks.map(track => {
                  const active = current?.id === track.id
                  return (
                    <article key={track.id} className="group flex items-center gap-3 py-2.5 min-w-0">
                      <button onClick={() => play(track)} className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0" style={{ background: 'var(--cosmos-card)' }} aria-label={`${active && playing ? 'Pause' : 'Play'} ${track.title}`}>
                        {track.artwork ? <img src={track.artwork} alt="" className="w-full h-full object-cover" loading="lazy" /> : <span className="grid place-items-center w-full h-full text-xl">♪</span>}
                        <span className="absolute inset-0 grid place-items-center bg-black/25 text-white text-xs opacity-0 group-hover:opacity-100">{active && playing ? 'Ⅱ' : '▶'}</span>
                      </button>

                      <button onClick={() => play(track)} className="min-w-0 flex-1 text-left">
                        <div className="font-bold text-sm sm:text-[15px] truncate">{track.title}</div>
                        <div className="text-xs sm:text-sm otya-muted truncate mt-0.5">{track.artist || 'Unknown artist'}{track.album ? ` · ${track.album}` : ''}</div>
                      </button>

                      <div className="hidden sm:block text-xs otya-muted shrink-0">{formatDuration(track.durationSeconds)}</div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => play(track)} className="w-9 h-9 rounded-full grid place-items-center text-xs font-bold" style={{ background: active ? 'var(--cosmos-text-primary)' : 'var(--cosmos-card)', color: active ? 'var(--cosmos-scaffold)' : 'var(--cosmos-text-primary)' }} aria-label={active && playing ? 'Pause' : 'Play'}>{active && playing ? 'Ⅱ' : '▶'}</button>
                        {track.downloadAllowed && <a href={downloadHref(track)} className="w-9 h-9 rounded-full grid place-items-center text-sm font-bold" style={{ background: 'var(--cosmos-card)' }} aria-label={`Download ${track.title}`} title="Download">↓</a>}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      <audio ref={audioRef} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />

      {current && <div className="fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-xl" style={{ background: 'var(--nav-bg)', borderColor: 'var(--cosmos-divider)' }}>
        <div className="otya-shell min-h-[76px] py-2 flex items-center gap-3">
          <button onClick={() => play(current)} className="w-12 h-12 rounded-xl overflow-hidden shrink-0" style={{ background: 'var(--cosmos-card)' }} aria-label={playing ? `Pause ${current.title}` : `Play ${current.title}`}>
            {current.artwork ? <img src={current.artwork} alt="" className="w-full h-full object-cover" /> : <span className="grid place-items-center w-full h-full">♪</span>}
          </button>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm truncate">{current.title}</div>
            <div className="text-xs otya-muted truncate">{current.artist || 'Unknown artist'}</div>
          </div>
          {current.downloadAllowed && <a href={downloadHref(current)} className="w-10 h-10 rounded-full grid place-items-center font-bold shrink-0" style={{ background: 'var(--cosmos-card)' }} aria-label={`Download ${current.title}`}>↓</a>}
          <button onClick={() => play(current)} className="w-11 h-11 rounded-full grid place-items-center font-bold shrink-0" style={{ background: 'var(--cosmos-text-primary)', color: 'var(--cosmos-scaffold)' }} aria-label={playing ? 'Pause' : 'Play'}>{playing ? 'Ⅱ' : '▶'}</button>
        </div>
      </div>}

      <SiteFooter />
    </div>
  )
}
