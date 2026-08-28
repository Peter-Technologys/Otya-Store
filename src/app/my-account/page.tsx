'use client'

import {FormEvent,useEffect,useState} from 'react'
import Link from 'next/link'

type User={id:string;email:string;name?:string|null;avatar_url?:string|null;is_verified?:boolean|number}
type Model={id:string;name:string;provider:string;tier:string;description:string}
type Consent={terms_accepted?:number;privacy_accepted?:number;marketing_consent?:number}

const TERMS_VERSION='2026-08-28'
const PRIVACY_VERSION='2026-08-28'

export default function AccountPage(){
  const[token,setToken]=useState('')
  const[user,setUser]=useState<User|null>(null)
  const[email,setEmail]=useState('')
  const[password,setPassword]=useState('')
  const[name,setName]=useState('')
  const[registering,setRegistering]=useState(false)
  const[termsAccepted,setTermsAccepted]=useState(false)
  const[privacyAccepted,setPrivacyAccepted]=useState(false)
  const[marketingConsent,setMarketingConsent]=useState(false)
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
      if(r.status===401){void signOut();return}
      if(r.ok)setUser(d.user||d)
    }catch{}
  }
  async function loadModels(t:string){
    try{const r=await fetch('/api/ai/chat?models=1',{headers:{Authorization:`Bearer ${t}`},cache:'no-store'}),d=await r.json();if(r.ok){setModels(d.models||[]);if(!(d.models||[]).some((m:Model)=>m.id===model)){const next=d.default_model||'otya-smart';setModel(next);localStorage.setItem('otya_ai_model',next)}}}catch{}
  }
  async function loadConsent(t:string){
    try{const r=await fetch('/auth/consent',{headers:{Authorization:`Bearer ${t}`},cache:'no-store'}),d=await r.json();if(r.ok)setConsent(d.consent||null)}catch{}
  }
  function persistAuth(d:Record<string,any>){
    sessionStorage.setItem('otya_access_token',d.access_token||'')
    sessionStorage.setItem('otya_refresh_token',d.refresh_token||'')
    sessionStorage.setItem('otya_ai_user',JSON.stringify(d.user||{}))
    setToken(d.access_token||'');setUser(d.user||null);setPassword('')
  }
  async function submitAuth(e:FormEvent){
    e.preventDefault();if(!email.trim()||!password)return
    if(registering&&(!termsAccepted||!privacyAccepted)){setError('Accept the Terms of Service and Privacy Policy to create an OTYA account.');return}
    setBusy(true);setError('')
    try{
      const endpoint=registering?'/auth/register':'/auth/login'
      const payload=registering?{
        email:email.trim(),password,name:name.trim()||undefined,
        terms_accepted:true,terms_version:TERMS_VERSION,
        privacy_accepted:true,privacy_version:PRIVACY_VERSION,
        marketing_consent:marketingConsent,
      }:{email:email.trim(),password}
      const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      const d=await r.json().catch(()=>({}))
      if(!r.ok)throw new Error(d.error||(registering?'Account creation failed':'Sign in failed'))
      persistAuth(d)
    }catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }
  async function signOut(){
    const refresh=sessionStorage.getItem('otya_refresh_token')||''
    try{if(refresh)await fetch('/auth/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refresh_token:refresh})})}catch{}
    sessionStorage.removeItem('otya_access_token');sessionStorage.removeItem('otya_refresh_token');sessionStorage.removeItem('otya_ai_user')
    setToken('');setUser(null);setConsent(null)
  }
  function chooseModel(id:string){setModel(id);localStorage.setItem('otya_ai_model',id)}

  if(!token)return <main className="min-h-[100dvh] grid place-items-center p-4" style={{background:'var(--cosmos-scaffold)',color:'var(--cosmos-text-primary)'}}><form onSubmit={submitAuth} className="w-full max-w-md rounded-3xl border p-6 sm:p-8" style={{background:'var(--cosmos-card)',borderColor:'var(--cosmos-divider)'}}><div className="text-sm font-bold" style={{color:'var(--cosmos-primary)'}}>OTYA</div><h1 className="text-3xl font-bold mt-1">{registering?'Create your OTYA account':'One account for OTYA'}</h1><p className="text-sm opacity-65 mt-2 mb-6">{registering?'Create one identity for OTYA Player, OTYA AI and future OTYA products.':'Sign in once and use the same OTYA account across OTYA products.'}</p>{error&&<div className="mb-3 text-sm text-red-500">{error}</div>}{registering&&<input type="text" autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Name (optional)" className="w-full rounded-xl border bg-transparent px-4 py-3 mb-3" style={{borderColor:'var(--cosmos-divider)'}}/>}<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border bg-transparent px-4 py-3 mb-3" style={{borderColor:'var(--cosmos-divider)'}}/><input type="password" autoComplete={registering?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full rounded-xl border bg-transparent px-4 py-3" style={{borderColor:'var(--cosmos-divider)'}}/>{registering&&<div className="mt-4 space-y-3 text-sm"><label className="flex gap-2 items-start"><input type="checkbox" checked={termsAccepted} onChange={e=>setTermsAccepted(e.target.checked)} className="mt-1"/><span>I accept the <Link href="/terms" className="font-semibold" style={{color:'var(--cosmos-primary)'}}>OTYA Terms of Service</Link>.</span></label><label className="flex gap-2 items-start"><input type="checkbox" checked={privacyAccepted} onChange={e=>setPrivacyAccepted(e.target.checked)} className="mt-1"/><span>I accept the <Link href="/privacy" className="font-semibold" style={{color:'var(--cosmos-primary)'}}>OTYA Privacy Policy</Link>.</span></label><label className="flex gap-2 items-start"><input type="checkbox" checked={marketingConsent} onChange={e=>setMarketingConsent(e.target.checked)} className="mt-1"/><span>Send me optional OTYA product news and announcements.</span></label></div>}<button disabled={busy} className="cosmos-button w-full rounded-xl py-3 mt-4 font-semibold">{busy?(registering?'Creating account…':'Signing in…'):(registering?'Create OTYA account':'Sign in to OTYA')}</button><button type="button" onClick={()=>{setRegistering(v=>!v);setError('')}} className="w-full mt-3 text-sm font-semibold opacity-70">{registering?'Already have an account? Sign in':'New to OTYA? Create an account'}</button><div className="flex justify-center gap-4 mt-5 text-sm"><Link href="/ai" className="opacity-65">OTYA AI</Link><Link href="/documents" className="opacity-65">Documents</Link></div></form></main>

  return <main className="min-h-[100dvh] p-4 sm:p-7" style={{background:'var(--cosmos-scaffold)',color:'var(--cosmos-text-primary)'}}><div className="max-w-4xl mx-auto"><header className="flex items-start justify-between gap-4 mb-7"><div><div className="text-sm font-bold" style={{color:'var(--cosmos-primary)'}}>OTYA ACCOUNT</div><h1 className="text-3xl font-bold mt-1">Your account</h1><p className="text-sm opacity-60 mt-1">One identity across OTYA products.</p></div><button onClick={()=>void signOut()} className="rounded-xl border px-4 py-2 text-sm" style={{borderColor:'var(--cosmos-divider)'}}>Sign out</button></header>

    <div className="grid md:grid-cols-2 gap-4">
      <section className="rounded-2xl border p-5" style={{background:'var(--cosmos-card)',borderColor:'var(--cosmos-divider)'}}><h2 className="font-bold text-lg">Identity</h2><div className="mt-4 space-y-3 text-sm"><div><div className="opacity-50 text-xs">Email</div><div>{user?.email||'Loading…'}</div></div><div><div className="opacity-50 text-xs">Name</div><div>{user?.name||'Not set'}</div></div><div><div className="opacity-50 text-xs">Account ID</div><div className="font-mono text-xs break-all opacity-75">{user?.id||'Loading…'}</div></div><div><div className="opacity-50 text-xs">Verification</div><div>{user?.is_verified?'Verified':'Verification required'}</div></div></div></section>

      <section className="rounded-2xl border p-5" style={{background:'var(--cosmos-card)',borderColor:'var(--cosmos-divider)'}}><h2 className="font-bold text-lg">Privacy & consent</h2><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span>Terms</span><strong>{consent?.terms_accepted?'Accepted':'Needs review'}</strong></div><div className="flex justify-between"><span>Privacy policy</span><strong>{consent?.privacy_accepted?'Accepted':'Needs review'}</strong></div><div className="flex justify-between"><span>Marketing</span><strong>{consent?.marketing_consent?'On':'Off'}</strong></div><div className="flex gap-4 flex-wrap"><Link href="/documents" className="inline-block mt-2 text-sm font-semibold" style={{color:'var(--cosmos-primary)'}}>Documents →</Link><Link href="/privacy" className="inline-block mt-2 text-sm font-semibold" style={{color:'var(--cosmos-primary)'}}>Privacy →</Link></div></div></section>

      <section className="rounded-2xl border p-5 md:col-span-2" style={{background:'var(--cosmos-card)',borderColor:'var(--cosmos-divider)'}}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-lg">OTYA AI</h2><p className="text-sm opacity-60">Choose your preferred signed-in model. Guest sessions always use OTYA Fast.</p></div><Link href="/ai" className="rounded-xl border px-4 py-2 text-sm font-semibold" style={{borderColor:'var(--cosmos-divider)'}}>Open OTYA AI</Link></div><select value={model} onChange={e=>chooseModel(e.target.value)} className="mt-4 w-full sm:max-w-md rounded-xl border bg-transparent px-3 py-3" style={{borderColor:'var(--cosmos-divider)'}}>{models.map(m=><option key={m.id} value={m.id}>{m.name} · {m.provider}</option>)}</select>{models.find(m=>m.id===model)&&<p className="text-xs opacity-55 mt-2">{models.find(m=>m.id===model)?.description}</p>}</section>

      <section className="rounded-2xl border p-5 md:col-span-2" style={{background:'var(--cosmos-card)',borderColor:'var(--cosmos-divider)'}}><h2 className="font-bold text-lg">Products</h2><p className="text-sm opacity-60 mt-1">Your OTYA account is the shared identity. Each product keeps its own private app data under this account ID.</p><div className="mt-4 rounded-xl border p-4 flex items-center justify-between" style={{borderColor:'var(--cosmos-divider)'}}><div><strong>OTYA Player</strong><div className="text-xs opacity-55">Media, playback, sync and support</div></div><Link href="/otya-player" className="text-sm font-semibold" style={{color:'var(--cosmos-primary)'}}>View</Link></div><p className="text-xs opacity-45 mt-3">Future OTYA products can use this same account without creating another identity, while their private data remains separately scoped.</p></section>
    </div>
  </div></main>
}
