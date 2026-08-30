'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

type Track = { id:string; title:string; artist:string; album:string; artwork:string; durationSeconds:number; streamUrl:string; downloadAllowed:boolean; downloadUrl:string; shareUrl:string; licenseUrl:string; provider:string }
type MusicResponse = { ok?:boolean; tracks?:Track[]; error?:string }

function formatDuration(seconds:number){if(!Number.isFinite(seconds)||seconds<=0)return'';const minutes=Math.floor(seconds/60);return`${minutes}:${Math.floor(seconds%60).toString().padStart(2,'0')}`}

export default function MusicPage(){
  const [query,setQuery]=useState('')
  const [tracks,setTracks]=useState<Track[]>([])
  const [current,setCurrent]=useState<Track|null>(null)
  const [playing,setPlaying]=useState(false)
  const [loading,setLoading]=useState(true)
  const [message,setMessage]=useState('')
  const audioRef=useRef<HTMLAudioElement>(null)

  async function loadMusic(nextQuery=''){
    setLoading(true);setMessage('')
    try{
      const url=new URL('/api/music/jamendo',window.location.origin)
      if(nextQuery.trim())url.searchParams.set('q',nextQuery.trim())
      url.searchParams.set('limit','30')
      const response=await fetch(url,{headers:{Accept:'application/json'}})
      const data=await response.json().catch(()=>({})) as MusicResponse
      if(!response.ok||data.ok===false)throw new Error(data.error||'Music is unavailable right now.')
      const nextTracks=Array.isArray(data.tracks)?data.tracks:[]
      setTracks(nextTracks)
      if(!nextTracks.length)setMessage(nextQuery?'No matches found. Try another song, artist or mood.':'No music is available right now.')
    }catch(error){setTracks([]);setMessage((error as Error).message||'Music is unavailable right now.')}
    finally{setLoading(false)}
  }

  useEffect(()=>{const params=new URLSearchParams(window.location.search);const initial=params.get('q')||'';setQuery(initial);void loadMusic(initial)},[])

  function submit(event:FormEvent){event.preventDefault();const next=query.trim();window.history.replaceState(null,'',next?`/music?q=${encodeURIComponent(next)}`:'/music');void loadMusic(next)}

  function play(track:Track){
    const audio=audioRef.current
    if(!audio)return
    if(current?.id===track.id){if(audio.paused)void audio.play().catch(()=>setPlaying(false));else audio.pause();return}
    setCurrent(track);audio.src=track.streamUrl;audio.load();void audio.play().catch(()=>setPlaying(false))
  }

  const downloadHref=(track:Track)=>`/api/music/jamendo/download/${encodeURIComponent(track.id)}`

  return <div className="min-h-screen flex flex-col bg-[color:var(--cosmos-scaffold)] text-[color:var(--cosmos-text-primary)]">
    <SiteNav />
    <main className="flex-1 pb-32">
      <section className="otya-shell pt-8 sm:pt-11 pb-6">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-5xl font-black tracking-[-.055em]">Music</h1>
          <p className="mt-2 text-sm sm:text-base otya-muted">Search and play. Nothing complicated.</p>
        </div>

        <form onSubmit={submit} className="sticky top-[109px] sm:top-[64px] z-30 mt-6 py-2 bg-[color:color-mix(in_srgb,var(--cosmos-scaffold)_90%,transparent)] backdrop-blur-xl">
          <div className="max-w-3xl flex items-center gap-2 rounded-[22px] border border-black/[.07] dark:border-white/[.09] bg-white/80 dark:bg-white/[.025] p-1.5 shadow-sm">
            <span className="pl-3 text-lg opacity-40" aria-hidden="true">⌕</span>
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Song, artist, album or mood" aria-label="Search music" className="min-h-11 min-w-0 flex-1 rounded-2xl px-2 outline-none bg-transparent" />
            <button className="cosmos-button min-h-11 rounded-[16px] px-4 sm:px-5 font-black text-sm shrink-0" disabled={loading}>{loading?'…':'Search'}</button>
          </div>
        </form>
      </section>

      <section className="otya-shell">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div><h2 className="text-xl sm:text-2xl font-black">{query.trim()?`Results for “${query.trim()}”`:'Discover'}</h2><p className="mt-1 text-xs otya-muted">Music supplied by supported providers.</p></div>
          {!loading&&tracks.length>0&&<span className="text-xs otya-muted">{tracks.length} tracks</span>}
        </div>

        {loading?<div className="grid gap-2.5">{Array.from({length:8}).map((_,i)=><div key={i} className="h-[76px] rounded-[20px] animate-pulse bg-black/[.035] dark:bg-white/[.04]"/>)}</div>
        :message?<div className="rounded-[22px] border border-black/[.06] dark:border-white/[.08] bg-white/70 dark:bg-white/[.025] p-6 text-sm otya-muted">{message}</div>
        :<div className="grid gap-1.5">{tracks.map((track,index)=>{const active=current?.id===track.id;return <article key={track.id} className={`group grid grid-cols-[58px_minmax(0,1fr)_auto] sm:grid-cols-[64px_minmax(0,1fr)_70px_auto] items-center gap-3 rounded-[20px] p-2.5 sm:p-2 transition ${active?'bg-black/[.05] dark:bg-white/[.07]':'hover:bg-black/[.025] dark:hover:bg-white/[.035]'}`}>
          <button onClick={()=>play(track)} className="relative w-[58px] h-[58px] sm:w-16 sm:h-16 rounded-[16px] overflow-hidden shrink-0 bg-black/[.04] dark:bg-white/[.05]" aria-label={`${active&&playing?'Pause':'Play'} ${track.title}`}>
            {track.artwork?<img src={track.artwork} alt="" width={64} height={64} decoding="async" className="w-full h-full object-cover" loading={index<6?'eager':'lazy'}/>:<span className="grid place-items-center w-full h-full text-xl">♪</span>}
            <span className="absolute inset-0 grid place-items-center bg-black/30 text-white text-xs opacity-0 group-hover:opacity-100">{active&&playing?'Ⅱ':'▶'}</span>
          </button>

          <button onClick={()=>play(track)} className="min-w-0 text-left">
            <div className="font-black text-sm sm:text-[15px] truncate">{track.title}</div>
            <div className="mt-0.5 text-xs sm:text-sm otya-muted truncate">{track.artist||'Unknown artist'}{track.album?` · ${track.album}`:''}</div>
            <div className="mt-1 text-[10px] uppercase tracking-[.11em] font-black otya-muted opacity-70">{track.provider||'Music'}</div>
          </button>

          <div className="hidden sm:block text-xs otya-muted text-right">{formatDuration(track.durationSeconds)}</div>

          <div className="flex items-center gap-1.5 shrink-0">
            {track.downloadAllowed&&<a href={downloadHref(track)} className="w-10 h-10 rounded-full grid place-items-center text-base font-black border border-black/[.06] dark:border-white/[.08] bg-white/70 dark:bg-white/[.035]" aria-label={`Download ${track.title}`} title="Download">↓</a>}
            <button onClick={()=>play(track)} className={`w-11 h-11 rounded-full grid place-items-center text-xs font-black ${active?'cosmos-button':'border border-black/[.06] dark:border-white/[.08] bg-white/70 dark:bg-white/[.035]'}`} aria-label={active&&playing?'Pause':'Play'}>{active&&playing?'Ⅱ':'▶'}</button>
          </div>
        </article>})}</div>}
      </section>
    </main>

    <audio ref={audioRef} preload="none" onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>setPlaying(false)}/>

    {current&&<div className="fixed inset-x-0 bottom-0 z-[60] px-2 pb-[max(8px,env(safe-area-inset-bottom))] sm:px-4 sm:pb-4">
      <div className="mx-auto max-w-[760px] min-h-[74px] flex items-center gap-3 rounded-[24px] border border-black/[.08] dark:border-white/[.10] bg-[color:color-mix(in_srgb,var(--cosmos-app-bar)_95%,transparent)] backdrop-blur-2xl p-2.5 shadow-[0_20px_60px_rgba(0,0,0,.18)]">
        <button onClick={()=>play(current)} className="w-12 h-12 rounded-[14px] overflow-hidden shrink-0 bg-black/[.04] dark:bg-white/[.05]" aria-label={playing?`Pause ${current.title}`:`Play ${current.title}`}>
          {current.artwork?<img src={current.artwork} alt="" width={48} height={48} decoding="async" className="w-full h-full object-cover"/>:<span className="grid place-items-center w-full h-full">♪</span>}
        </button>
        <div className="min-w-0 flex-1"><div className="font-black text-sm truncate">{current.title}</div><div className="text-xs otya-muted truncate">{current.artist||'Unknown artist'}</div></div>
        {current.downloadAllowed&&<a href={downloadHref(current)} className="w-10 h-10 rounded-full grid place-items-center font-black shrink-0 border border-black/[.06] dark:border-white/[.08]" aria-label={`Download ${current.title}`}>↓</a>}
        <button onClick={()=>play(current)} className="w-12 h-12 rounded-full grid place-items-center font-black shrink-0 cosmos-button" aria-label={playing?'Pause':'Play'}>{playing?'Ⅱ':'▶'}</button>
      </div>
    </div>}

    <SiteFooter />
  </div>
}
