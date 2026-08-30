'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

type Abi = 'arm64' | 'arm32' | 'unknown'
type VersionData = { version?: string; versionCode?: number; date?: string; changelog?: string; downloads?: { arm64?: string; arm32?: string; auto?: string } }

declare global { interface Window { turnstile?: { render:(element:HTMLElement,options:{sitekey:string;theme?:'dark'|'light'|'auto';size?:'normal'|'compact'|'flexible';callback:(token:string)=>void;'expired-callback'?:()=>void;'error-callback'?:()=>void})=>string } } }

function detectAbi(): Abi {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  if (/arm64|aarch64|armv8/i.test(ua)) return 'arm64'
  if (/armv7|armeabi/i.test(ua)) return 'arm32'
  return /android/i.test(ua) ? 'arm64' : 'unknown'
}

export function DownloadPageClient() {
  const [abi,setAbi]=useState<Abi>('unknown')
  const [release,setRelease]=useState<VersionData|null>(null)
  const [loading,setLoading]=useState(true)
  const [status,setStatus]=useState<'idle'|'verifying'|'started'>('idle')
  const [protection,setProtection]=useState<{enabled:boolean;siteKey:string|null}>({enabled:false,siteKey:null})
  const [turnstileToken,setTurnstileToken]=useState('')
  const [error,setError]=useState('')
  const turnstileHost=useRef<HTMLDivElement>(null)
  const rendered=useRef(false)

  useEffect(()=>{
    setAbi(detectAbi())
    Promise.allSettled([
      fetch('/latest',{cache:'no-store'}).then(r=>r.ok?r.json() as Promise<VersionData>:Promise.reject(r.status)).then(setRelease),
      fetch('/api/download/config',{cache:'no-store'}).then(r=>r.ok?r.json() as Promise<{turnstile?:boolean;siteKey?:string|null}>:Promise.reject(r.status)).then(config=>setProtection({enabled:Boolean(config.turnstile&&config.siteKey),siteKey:config.siteKey??null})),
    ]).finally(()=>setLoading(false))
  },[])

  useEffect(()=>{
    if(!protection.enabled||!protection.siteKey||rendered.current)return
    const renderWidget=()=>{
      if(!turnstileHost.current||!window.turnstile||rendered.current||!protection.siteKey)return
      window.turnstile.render(turnstileHost.current,{sitekey:protection.siteKey,theme:'auto',size:'flexible',callback:token=>{setTurnstileToken(token);setError('')},'expired-callback':()=>setTurnstileToken(''),'error-callback':()=>{setTurnstileToken('');setError('Verification could not load. Try again.')}})
      rendered.current=true
    }
    if(window.turnstile){renderWidget();return}
    const existing=document.querySelector<HTMLScriptElement>('script[data-otya-turnstile]')
    if(existing){existing.addEventListener('load',renderWidget,{once:true});return()=>existing.removeEventListener('load',renderWidget)}
    const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.defer=true;script.dataset.otyaTurnstile='true';script.addEventListener('load',renderWidget,{once:true});document.head.appendChild(script);return()=>script.removeEventListener('load',renderWidget)
  },[protection])

  const isAndroid=abi!=='unknown'
  const fallbackUrl=abi==='arm32'?'/apk/arm32':'/apk/arm64'
  const directUrl=abi==='arm32'?release?.downloads?.arm32??fallbackUrl:release?.downloads?.arm64??release?.downloads?.auto??fallbackUrl

  async function download(){
    setError('')
    if(!isAndroid){setError('Open this page on a supported Android phone to download Otya.');return}
    if(!protection.enabled){setStatus('started');window.location.assign(directUrl);return}
    if(!turnstileToken){setError('Complete the verification before downloading.');return}
    setStatus('verifying')
    try{
      const response=await fetch('/api/download/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:turnstileToken,abi:abi==='arm32'?'arm32':'arm64'})})
      const body=await response.json() as {ok?:boolean;url?:string;error?:string}
      if(!response.ok||!body.ok||!body.url)throw new Error(body.error||'Verification failed.')
      setStatus('started');window.location.assign(body.url)
    }catch(cause){setStatus('idle');setTurnstileToken('');setError(cause instanceof Error?cause.message:'Download verification failed.')}
  }

  return <div className="min-h-screen flex flex-col otya-ambient" style={{color:'var(--cosmos-text-primary)'}}>
    <SiteNav />
    <main className="flex-1 pb-24 md:pb-0">
      <section className="otya-shell py-11 sm:py-16 grid lg:grid-cols-[1fr_.72fr] gap-9 lg:gap-16 items-center">
        <div>
          <div className="flex items-center gap-4 mb-7"><Image src="/web-app-manifest-192x192.png" alt="Otya" width={64} height={64} className="rounded-[18px]" priority/><div><div className="otya-kicker mb-1">Android</div><h1 className="text-3xl font-extrabold tracking-[-.045em]">Otya</h1></div></div>
          <h2 className="text-4xl sm:text-6xl font-extrabold tracking-[-.055em] leading-[.96] max-w-2xl">Your media.<br/>Ready offline.</h2>
          <p className="mt-5 max-w-xl text-base sm:text-lg otya-muted">Local video and music, nearby Transfer and Private media—without requiring an account just to play your files.</p>
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs otya-muted"><span>Official release</span><span>ARM Android</span><span>Offline-first</span></div>
        </div>

        <aside className="modern-card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4"><div><div className="otya-kicker">Latest release</div><div className="font-extrabold text-xl mt-1">{loading?'Checking…':release?.version?`Otya ${release.version}`:'Otya for Android'}</div>{release?.date&&<div className="text-xs mt-1 otya-muted">Released {release.date}</div>}</div>{release?.version&&<span className="rounded-full border px-2.5 py-1 text-[10px] font-extrabold" style={{borderColor:'var(--cosmos-divider)',color:'var(--cosmos-primary)'}}>LATEST</span>}</div>
          {release?.changelog&&<details className="mt-5 border-t pt-4" style={{borderColor:'var(--cosmos-divider)'}}><summary className="cursor-pointer text-xs font-extrabold">What changed</summary><p className="text-xs leading-relaxed otya-muted whitespace-pre-line mt-2">{release.changelog}</p></details>}
          <div className="mt-5 border-t pt-5" style={{borderColor:'var(--cosmos-divider)'}}>
            {isAndroid?<>{protection.enabled&&<div className="mb-4"><div ref={turnstileHost}/></div>}<button type="button" disabled={status==='verifying'} onClick={download} className="cosmos-button w-full rounded-full px-5 py-3.5 text-sm font-extrabold disabled:opacity-60">{status==='verifying'?'Verifying…':status==='started'?'Download started':`Download${release?.version?` · v${release.version}`:''}`}</button><p className="text-[11px] mt-3 text-center otya-muted">Otya selects the appropriate official ARM build.</p></>:<div className="rounded-2xl border p-4 text-center" style={{borderColor:'var(--cosmos-divider)'}}><div className="font-bold text-sm">Android download</div><p className="text-xs mt-1.5 otya-muted">Open this page on a supported Android phone.</p></div>}
            {error&&<p className="text-xs mt-3 text-center" style={{color:'var(--cosmos-error)'}}>{error}</p>}
          </div>
        </aside>
      </section>

      <section className="otya-shell pb-12"><div className="border-t pt-5 flex flex-wrap gap-5 text-sm font-bold" style={{borderColor:'var(--cosmos-divider)'}}><Link href="/otya-player">About Otya Player</Link><Link href="/help">Help</Link><Link href="/privacy">Privacy</Link></div></section>
    </main>
    <SiteFooter />
  </div>
}
