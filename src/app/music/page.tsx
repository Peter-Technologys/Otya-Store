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
      if (!response.ok || data.ok === false) throw new Error(data.error || 'Online music is unavailable right now.')
      const nextTracks = Array.isArray(data.tracks) ? data.tracks : []
      setTracks(nextTracks)
      if (!nextTracks.length) setMessage(nextQuery ? 'No online matches found.' : 'No online tracks are available right now.')
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
    window.history.replaceState(null, '', next ? `/music?q=${encodeURIComponent(next)}` : '/music')
    void loadMusic(next)
  }

  function play(track: Track) {
    const audio = audioRef.current
    if (!audio) return

    if (current?.id === track.id) {
      if (audio.paused) {
        void audio.play().catch(() => setPlaying(false))
      } else {
        audio.pause()
      }
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
        <div className="otya-shell py-8 sm:py-12">
          <header className="max-w-3xl mb-7">
            <div className="otya-kicker mb-3">OTYA · Online Music</div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-[-.045em]">Discover. Play. Download when allowed.</h1>
            <p className="mt-3 text-sm sm:text-base otya-muted max-w-2xl">
              Find provider-authorized music without turning OTYA into a streaming-only app. Local playback stays first; online music is an optional extension.
            </p>
          </header>

          <form onSubmit={submit} className="sticky top-[57px] z-30 -mx-3 px-3 py-3 mb-6 backdrop-blur-xl sm:static sm:mx-0 sm:px-0 sm:py-0 sm:backdrop-blur-none" style={{ background: 'color-mix(in srgb, var(--cosmos-scaffold) 88%, transparent)' }}>
            <div className="max-w-3xl flex gap-2">
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search songs, artists or albums"
                aria-label="Search online music"
                className="min-h-12 min-w-0 flex-1 rounded-xl border px-4 outline-none"
                style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)', color: 'var(--cosmos-text-primary)' }}
              />
              <button className="cosmos-button min-h-12 rounded-xl px-4 sm:px-5 font-bold text-sm shrink-0" disabled={loading}>{loading ? 'Searching…' : 'Search'}</button>
            </div>
          </form>

          <section>
            <div className="flex items-end justify-between gap-4 mb-4">
              <div>
                <div className="otya-kicker mb-1">Online songs</div>
                <h2 className="text-xl sm:text-2xl font-black">{query.trim() ? `Results for “${query.trim()}”` : 'Discover music'}</h2>
              </div>
              <Link href="/docs/online-music" className="hidden sm:inline text-sm font-semibold otya-muted">How online music works →</Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {Array.from({ length: 10 }).map((_, index) => <div key={index} className="aspect-[.82] rounded-2xl animate-pulse" style={{ background: 'var(--cosmos-card)' }} />)}
              </div>
            ) : message ? (
              <div className="rounded-2xl border p-5 text-sm otya-muted" style={{ borderColor: 'var(--cosmos-divider)' }}>{message}</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {tracks.map(track => {
                  const active = current?.id === track.id
                  return <article key={track.id} className="min-w-0 rounded-2xl border overflow-hidden" style={{ background: 'var(--cosmos-card)', borderColor: active ? 'var(--cosmos-primary)' : 'var(--cosmos-divider)' }}>
                    <button onClick={() => play(track)} className="relative block w-full aspect-square overflow-hidden text-left" aria-label={`${active && playing ? 'Pause' : 'Play'} ${track.title}`} style={{ background: 'var(--cosmos-surface)' }}>
                      {track.artwork ? <img src={track.artwork} alt="" className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full grid place-items-center text-3xl">♪</div>}
                      <span className="absolute inset-0 flex items-end justify-end p-2.5 bg-gradient-to-t from-black/40 via-transparent to-transparent">
                        <span className="w-10 h-10 rounded-full bg-black/80 text-white grid place-items-center shadow-lg text-sm">{active && playing ? 'Ⅱ' : '▶'}</span>
                      </span>
                    </button>

                    <div className="p-3 min-w-0">
                      <button onClick={() => play(track)} className="block w-full text-left min-w-0">
                        <div className="font-bold text-sm truncate">{track.title}</div>
                        <div className="text-xs otya-muted truncate mt-0.5">{track.artist || 'Unknown artist'}</div>
                      </button>

                      <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
                        <span className="otya-muted truncate">{track.album || formatDuration(track.durationSeconds) || 'Jamendo'}</span>
                        {track.downloadAllowed ? <a href={downloadHref(track)} className="font-bold shrink-0" aria-label={`Download ${track.title}`}>Download</a> : <span className="otya-muted shrink-0">Play only</span>}
                      </div>
                    </div>
                  </article>
                })}
              </div>
            )}
          </section>

          <aside className="mt-8 border-t pt-5 text-xs leading-relaxed otya-muted" style={{ borderColor: 'var(--cosmos-divider)' }}>
            Online tracks are supplied by third-party providers and remain subject to each artist&apos;s license and provider terms. OTYA only shows a download action when the provider reports that downloading is allowed.
          </aside>
        </div>
      </main>

      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />

      {current && <div className="fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-xl" style={{ background: 'var(--nav-bg)', borderColor: 'var(--cosmos-divider)' }}>
        <div className="otya-shell min-h-[76px] py-2 flex items-center gap-3">
          <button onClick={() => play(current)} className="w-12 h-12 rounded-xl overflow-hidden shrink-0" style={{ background: 'var(--cosmos-card)' }} aria-label={playing ? `Pause ${current.title}` : `Play ${current.title}`}>
            {current.artwork ? <img src={current.artwork} alt="" className="w-full h-full object-cover" /> : <span className="grid place-items-center w-full h-full">♪</span>}
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[.12em] font-bold otya-muted">Now playing</div>
            <div className="font-bold text-sm truncate">{current.title}</div>
            <div className="text-xs otya-muted truncate">{current.artist || 'Unknown artist'}</div>
          </div>
          <button onClick={() => play(current)} className="w-11 h-11 rounded-full grid place-items-center font-bold shrink-0" style={{ background: 'var(--cosmos-text-primary)', color: 'var(--cosmos-scaffold)' }} aria-label={playing ? 'Pause' : 'Play'}>{playing ? 'Ⅱ' : '▶'}</button>
          {current.downloadAllowed && <a href={downloadHref(current)} className="hidden sm:inline-flex otya-quiet-button rounded-xl px-3 py-2 text-xs font-bold shrink-0">Download</a>}
        </div>
      </div>}

      <SiteFooter />
    </div>
  )
}
