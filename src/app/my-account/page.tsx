'use client'

import {FormEvent,useEffect,useState} from 'react'
import Link from 'next/link'

type User={id:string;email:string;name?:string|null;avatar_url?:string|null;is_verified?:boolean|number}
type Model={id:string;name:string;provider:string;tier:string;description:string}
type Consent={terms_accepted?:number;privacy_accepted?:number;marketing_consent?:number}

export default function AccountPage(){
  const[token,setToken]=useState('')
  const[user,setUser]=useState<User|null>(null)
  const[email,setEmail]=useState('')
  const[password,setPassword]=useState('')
  const[busy,setBusy]=useState(false)
  const[error,setError]=useState('')
  const[models,setModels]=useState<Model[]>([])
  const[model,setModel]=useState('otya-smart')
  const[consent,setConsent]=useState<Consent|null>(null)

  useEffect(()=>{
    const t=sessionStorage.getItem('otya_access_token')||''
    setToken(t)
    setModel(localStorage.getItem('otya_ai_model')||'otya-smart')
  },[])

  useEffect(()=>{if(token){void loadAccount(token);void loadModels(token);void loadConsent(token)}},[token])

  async function loadAccount(t:string){
    try{
      const r=await fetch('/auth/me',{headers:{Authorization:`Bearer ${t}`},cache:'no-store'})
      const d=await r.json().catch(()=>({}))
      if(r.status===401){signOut();return}
      if(r.ok)setUser(d.user||d)
    }catch{}
  }
  async function loadModels(t:string){
    try{const r=await fetch('/api/ai/chat?models=1',{headers:{Authorization:`Bearer ${t}`},cache:'no-store'}),d=await r.json();if(r.ok){setModels(d.models||[]);if(!(d.models||[]).some((m:Model)=>m.id===model)){const next=d.default_model||'otya-smart';setModel(next);localStorage.setItem('otya_ai_model',next)}}}catch{}
  }
  async function loadConsent(t:string){
    try{const r=await fetch('/auth/consent',{headers:{Authorization:`Bearer ${t}`},cache:'no-store'}),d=await r.json();if(r.ok)setConsent(d.consent||null)}catch{}
  }
  async function login(e:FormEvent){
    e.preventDefault();if(!email.trim()||!password)return
    setBusy(true);setError('')
    try{
      const r=await fetch('/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email.trim(),password})})
      const d=await r.json().catch(()=>({}))
      if(!r.ok)throw new Error(d.error||'Sign in failed')
      sessionStorage.setItem('otya_access_token',d.access_token)
      sessionStorage.setItem('otya_refresh_token',d.refresh_token||'')
      sessionStorage.setItem('otya_ai_user',JSON.stringify(d.user||{}))
      setToken(d.access_token);setUser(d.user||null);setPassword('')
    }catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }
  async function signOut(){
    const refresh=sessionStorage.getItem('otya_refresh_token')||''
    try{if(refresh)await fetch('/auth/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refresh_token:refresh})})}catch{}
    sessionStorage.removeItem('otya_access_token');sessionStorage.removeItem('otya_refresh_token');sessionStorage.removeItem('otya_ai_user')
    setToken('');setUser(null);setConsent(null)
  }
  function chooseModel(id:string){setModel(id);localStorage.setItem('otya_ai_model',id)}

  if(!token)return <main className="min-h-[100dvh] grid place-items-center p-4" style={{background:'var(--cosmos-scaffold)',color:'var(--cosmos-text-primary)'}}><form onSubmit={login} className="w-full max-w-md rounded-3xl border p-6 sm:p-8" style={{background:'var(--cosmos-card)',borderColor:'var(--cosmos-divider)'}}><div className="text-sm font-bold" style={{color:'var(--cosmos-primary)'}}>OTYA SYSTEM</div><h1 className="text-3xl font-bold mt-1">One account for OTYA</h1><p className="text-sm opacity-65 mt-2 mb-6">Sign in once and use the same OTYA System identity across OTYA Player and future OTYA products.</p>{error&&<div className="mb-3 text-sm text-red-500">{error}</div>}<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border bg-transparent px-4 py-3 mb-3" style={{borderColor:'var(--cosmos-divider)'}}/><input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full rounded-xl border bg-transparent px-4 py-3" style={{borderColor:'var(--cosmos-divider)'}}/><button disabled={busy} className="cosmos-button w-full rounded-xl py-3 mt-3 font-semibold">{busy?'Signing in…':'Sign in to OTYA System'}</button><div className="flex justify-center gap-4 mt-5 text-sm"><Link href="/ai" className="opacity-65">Back to OTYA AI</Link><Link href="/privacy" className="opacity-65">Privacy</Link></div></form></main>

  return <main className="min-h-[100dvh] p-4 sm:p-7" style={{background:'var(--cosmos-scaffold)',color:'var(--cosmos-text-primary)'}}><div className="max-w-4xl mx-auto"><header className="flex items-start justify-between gap-4 mb-7"><div><div className="text-sm font-bold" style={{color:'var(--cosmos-primary)'}}>OTYA SYSTEM ACCOUNT</div><h1 className="text-3xl font-bold mt-1">Your account</h1><p className="text-sm opacity-60 mt-1">One identity across OTYA products.</p></div><button onClick={signOut} className="rounded-xl border px-4 py-2 text-sm" style={{borderColor:'var(--cosmos-divider)'}}>Sign out</button></header>

    <div className="grid md:grid-cols-2 gap-4">
      <section className="rounded-2xl border p-5" style={{background:'var(--cosmos-card)',borderColor:'var(--cosmos-divider)'}}><h2 className="font-bold text-lg">Identity</h2><div className="mt-4 space-y-3 text-sm"><div><div className="opacity-50 text-xs">Email</div><div>{user?.email||'Loading…'}</div></div><div><div className="opacity-50 text-xs">Name</div><div>{user?.name||'Not set'}</div></div><div><div className="opacity-50 text-xs">Account ID</div><div className="font-mono text-xs break-all opacity-75">{user?.id||'Loading…'}</div></div><div><div className="opacity-50 text-xs">Verification</div><div>{user?.is_verified?'Verified':'Verification required'}</div></div></div></section>

      <section className="rounded-2xl border p-5" style={{background:'var(--cosmos-card)',borderColor:'var(--cosmos-divider)'}}><h2 className="font-bold text-lg">Privacy & consent</h2><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span>Terms</span><strong>{consent?.terms_accepted?'Accepted':'Needs review'}</strong></div><div className="flex justify-between"><span>Privacy policy</span><strong>{consent?.privacy_accepted?'Accepted':'Needs review'}</strong></div><div className="flex justify-between"><span>Marketing</span><strong>{consent?.marketing_consent?'On':'Off'}</strong></div><Link href="/privacy" className="inline-block mt-2 text-sm font-semibold" style={{color:'var(--cosmos-primary)'}}>Review privacy controls →</Link></div></section>

      <section className="rounded-2xl border p-5 md:col-span-2" style={{background:'var(--cosmos-card)',borderColor:'var(--cosmos-divider)'}}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-lg">OTYA AI</h2><p className="text-sm opacity-60">Choose your preferred signed-in model. Guest sessions always use OTYA Fast.</p></div><Link href="/ai" className="rounded-xl border px-4 py-2 text-sm font-semibold" style={{borderColor:'var(--cosmos-divider)'}}>Open OTYA AI</Link></div><select value={model} onChange={e=>chooseModel(e.target.value)} className="mt-4 w-full sm:max-w-md rounded-xl border bg-transparent px-3 py-3" style={{borderColor:'var(--cosmos-divider)'}}>{models.map(m=><option key={m.id} value={m.id}>{m.name} · {m.provider}</option>)}</select>{models.find(m=>m.id===model)&&<p className="text-xs opacity-55 mt-2">{models.find(m=>m.id===model)?.description}</p>}</section>

      <section className="rounded-2xl border p-5 md:col-span-2" style={{background:'var(--cosmos-card)',borderColor:'var(--cosmos-divider)'}}><h2 className="font-bold text-lg">Products</h2><p className="text-sm opacity-60 mt-1">Your OTYA System account is the shared identity. Each product keeps its own private app data under this account ID.</p><div className="mt-4 rounded-xl border p-4 flex items-center justify-between" style={{borderColor:'var(--cosmos-divider)'}}><div><strong>OTYA Player</strong><div className="text-xs opacity-55">Media, playback, sync and support</div></div><Link href="/otya-player" className="text-sm font-semibold" style={{color:'var(--cosmos-primary)'}}>View</Link></div><p className="text-xs opacity-45 mt-3">Future OTYA products can use this same account without creating another identity.</p></section>
    </div>
  </div></main>
}
