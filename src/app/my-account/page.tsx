'use client'

import {FormEvent,useEffect,useState} from 'react'
import Link from 'next/link'

type User={
  id:string;email:string;name?:string|null;avatar_url?:string|null;is_verified?:boolean|number;
  phone_number?:string|null;phone_verified_at?:string|null;phone_verification_method?:string|null;
  recovery_email?:string|null;recovery_email_verified_at?:string|null;country_code?:string|null;
  locale?:string|null;timezone?:string|null;created_at?:string;updated_at?:string
}
type Identity={provider:string;provider_username?:string|null;linked_at?:string;last_used_at?:string}
type Product={product_id:string;status:string;first_seen_at?:string;last_seen_at?:string}
type Model={id:string;name:string;provider:string;tier:string;description:string}
type Consent={terms_accepted?:number;privacy_accepted?:number;marketing_consent?:number}

const TERMS_VERSION='2026-08-28'
const PRIVACY_VERSION='2026-08-28'

export default function AccountPage(){
  const[token,setToken]=useState('')
  const[user,setUser]=useState<User|null>(null)
  const[identities,setIdentities]=useState<Identity[]>([])
  const[products,setProducts]=useState<Product[]>([])
  const[email,setEmail]=useState(''),[password,setPassword]=useState(''),[name,setName]=useState('')
  const[registering,setRegistering]=useState(false)
  const[termsAccepted,setTermsAccepted]=useState(false),[privacyAccepted,setPrivacyAccepted]=useState(false),[marketingConsent,setMarketingConsent]=useState(false)
  const[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
  const[models,setModels]=useState<Model[]>([]),[model,setModel]=useState('otya-smart'),[consent,setConsent]=useState<Consent|null>(null)
  const[editName,setEditName]=useState(''),[recoveryEmail,setRecoveryEmail]=useState(''),[country,setCountry]=useState(''),[locale,setLocale]=useState(''),[timezone,setTimezone]=useState('')
  const[phone,setPhone]=useState(''),[phoneCode,setPhoneCode]=useState(''),[phoneCodeSent,setPhoneCodeSent]=useState(false)
  const[emailCode,setEmailCode]=useState('')

  useEffect(()=>{
    const t=sessionStorage.getItem('otya_access_token')||''
    setToken(t)
    setModel(localStorage.getItem('otya_ai_model')||'otya-smart')
    setLocale(navigator.language||'')
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone||'')
  },[])
  useEffect(()=>{if(token){void loadAccount(token);void loadModels(token);void loadConsent(token)}},[token])

  function authHeaders(t=token){return{Authorization:`Bearer ${t}`,'Content-Type':'application/json'}}
  async function loadAccount(t:string){
    try{
      const r=await fetch('/auth/account',{headers:authHeaders(t),cache:'no-store'}),d=await r.json().catch(()=>({}))
      if(r.status===401){void signOut();return}
      if(!r.ok)throw new Error(d.error||'Could not load account')
      const u=d.user as User
      setUser(u);setIdentities(d.identities||[]);setProducts(d.products||[])
      setEditName(u.name||'');setRecoveryEmail(u.recovery_email||'');setCountry(u.country_code||'')
      setLocale(u.locale||navigator.language||'');setTimezone(u.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone||'')
      setPhone(u.phone_number||'')
    }catch(e){setError((e as Error).message)}
  }
  async function loadModels(t:string){try{const r=await fetch('/api/ai/chat?models=1',{headers:authHeaders(t),cache:'no-store'}),d=await r.json();if(r.ok){setModels(d.models||[]);if(!(d.models||[]).some((m:Model)=>m.id===model)){const next=d.default_model||'otya-smart';setModel(next);localStorage.setItem('otya_ai_model',next)}}}catch{}}
  async function loadConsent(t:string){try{const r=await fetch('/auth/consent',{headers:authHeaders(t),cache:'no-store'}),d=await r.json();if(r.ok)setConsent(d.consent||null)}catch{}}
  function persistAuth(d:Record<string,any>){sessionStorage.setItem('otya_access_token',d.access_token||'');sessionStorage.setItem('otya_refresh_token',d.refresh_token||'');sessionStorage.setItem('otya_ai_user',JSON.stringify(d.user||{}));setToken(d.access_token||'');setUser(d.user||null);setPassword('')}

  async function submitAuth(e:FormEvent){
    e.preventDefault();if(!email.trim()||!password)return
    if(registering&&(!termsAccepted||!privacyAccepted)){setError('Accept the Terms of Service and Privacy Policy to create an OTYA account.');return}
    setBusy(true);setError('')
    try{
      const endpoint=registering?'/auth/register':'/auth/login'
      const payload=registering?{email:email.trim(),password,name:name.trim()||undefined,terms_accepted:true,terms_version:TERMS_VERSION,privacy_accepted:true,privacy_version:PRIVACY_VERSION,marketing_consent:marketingConsent}:{email:email.trim(),password}
      const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),d=await r.json().catch(()=>({}))
      if(!r.ok)throw new Error(d.error||(registering?'Account creation failed':'Sign in failed'))
      persistAuth(d)
    }catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }
  async function signOut(){const refresh=sessionStorage.getItem('otya_refresh_token')||'';try{if(refresh)await fetch('/auth/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refresh_token:refresh})})}catch{}sessionStorage.removeItem('otya_access_token');sessionStorage.removeItem('otya_refresh_token');sessionStorage.removeItem('otya_ai_user');setToken('');setUser(null);setConsent(null)}
  function chooseModel(id:string){setModel(id);localStorage.setItem('otya_ai_model',id)}

  async function saveProfile(){
    setBusy(true);setError('');setNotice('')
    try{
      const r=await fetch('/auth/account',{method:'PATCH',headers:authHeaders(),body:JSON.stringify({name:editName||null,recovery_email:recoveryEmail||null,country_code:country||null,locale:locale||null,timezone:timezone||null})}),d=await r.json().catch(()=>({}))
      if(!r.ok)throw new Error(d.error||'Could not save profile')
      setNotice('Personal info saved.');await loadAccount(token)
    }catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }
  async function connectTelegram(){
    setBusy(true);setError('');setNotice('')
    try{const r=await fetch('/auth/telegram/start',{method:'POST',headers:authHeaders()}),d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Telegram linking is unavailable');window.location.assign(d.authorization_url)}catch(e){setError((e as Error).message);setBusy(false)}
  }
  async function requestPhoneCode(){
    if(!phone.trim())return
    setBusy(true);setError('');setNotice('')
    try{const r=await fetch('/auth/phone/request',{method:'POST',headers:authHeaders(),body:JSON.stringify({phone_number:phone.trim()})}),d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Could not send code');setPhoneCodeSent(true);setNotice(d.message||'Verification code sent in Telegram.')}catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }
  async function verifyPhoneCode(){
    if(!phoneCode.trim())return
    setBusy(true);setError('');setNotice('')
    try{const r=await fetch('/auth/phone/verify',{method:'POST',headers:authHeaders(),body:JSON.stringify({code:phoneCode.trim()})}),d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Could not verify phone');setPhoneCode('');setPhoneCodeSent(false);setNotice('Phone number verified.');await loadAccount(token)}catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }
  async function sendEmailVerification(){setBusy(true);setError('');try{const r=await fetch('/auth/send-verification',{method:'POST',headers:authHeaders()}),d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Could not send verification code');setNotice('Email verification code sent.')}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  async function verifyEmail(){if(!emailCode.trim())return;setBusy(true);setError('');try{const r=await fetch('/auth/verify-email',{method:'POST',headers:authHeaders(),body:JSON.stringify({otp:emailCode.trim()})}),d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Could not verify email');setEmailCode('');setNotice('Email verified.');await loadAccount(token)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}

  if(!token)return <main className="min-h-[100dvh] grid place-items-center p-4" style={{background:'var(--cosmos-scaffold)',color:'var(--cosmos-text-primary)'}}><form onSubmit={submitAuth} className="w-full max-w-md rounded-3xl border p-6 sm:p-8" style={{background:'var(--cosmos-card)',borderColor:'var(--cosmos-divider)'}}><div className="text-sm font-bold" style={{color:'var(--cosmos-primary)'}}>OTYA</div><h1 className="text-3xl font-bold mt-1">{registering?'Create your OTYA account':'One account for OTYA'}</h1><p className="text-sm opacity-65 mt-2 mb-6">{registering?'Start with only the basics. Phone and recovery details are optional and can be added later.':'Sign in once and use the same identity across OTYA products.'}</p>{error&&<div className="mb-3 text-sm text-red-500">{error}</div>}{registering&&<input type="text" autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Name (optional)" className="w-full rounded-xl border bg-transparent px-4 py-3 mb-3" style={{borderColor:'var(--cosmos-divider)'}}/>}<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border bg-transparent px-4 py-3 mb-3" style={{borderColor:'var(--cosmos-divider)'}}/><input type="password" autoComplete={registering?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full rounded-xl border bg-transparent px-4 py-3" style={{borderColor:'var(--cosmos-divider)'}}/>{registering&&<div className="mt-4 space-y-3 text-sm"><label className="flex gap-2 items-start"><input type="checkbox" checked={termsAccepted} onChange={e=>setTermsAccepted(e.target.checked)} className="mt-1"/><span>I accept the <Link href="/terms" className="font-semibold" style={{color:'var(--cosmos-primary)'}}>OTYA Terms</Link>.</span></label><label className="flex gap-2 items-start"><input type="checkbox" checked={privacyAccepted} onChange={e=>setPrivacyAccepted(e.target.checked)} className="mt-1"/><span>I accept the <Link href="/privacy" className="font-semibold" style={{color:'var(--cosmos-primary)'}}>OTYA Privacy Policy</Link>.</span></label><label className="flex gap-2 items-start"><input type="checkbox" checked={marketingConsent} onChange={e=>setMarketingConsent(e.target.checked)} className="mt-1"/><span>Send me optional OTYA news.</span></label></div>}<button disabled={busy} className="cosmos-button w-full rounded-xl py-3 mt-4 font-semibold">{busy?(registering?'Creating account…':'Signing in…'):(registering?'Create OTYA account':'Sign in to OTYA')}</button><button type="button" onClick={()=>{setRegistering(v=>!v);setError('')}} className="w-full mt-3 text-sm font-semibold opacity-70">{registering?'Already have an account? Sign in':'New to OTYA? Create an account'}</button><div className="flex justify-center gap-4 mt-5 text-sm"><Link href="/ai" className="opacity-65">AI</Link><Link href="/docs" className="opacity-65">Docs</Link></div></form></main>

  const telegram=identities.find(x=>x.provider==='telegram')
  return <main className="min-h-[100dvh] p-4 sm:p-6" style={{background:'var(--cosmos-scaffold)',color:'var(--cosmos-text-primary)'}}><div className="max-w-6xl mx-auto">
    <header className="flex items-start justify-between gap-4 mb-7"><div><div className="text-sm font-bold" style={{color:'var(--cosmos-primary)'}}>OTYA ACCOUNT</div><h1 className="text-3xl sm:text-4xl font-bold mt-1">Manage your OTYA Account</h1><p className="text-sm opacity-60 mt-1">Personal info, security, privacy and connected OTYA products.</p></div><button onClick={()=>void signOut()} className="rounded-xl border px-4 py-2 text-sm" style={{borderColor:'var(--cosmos-divider)'}}>Sign out</button></header>
    {(error||notice)&&<div className={`mb-5 rounded-xl border p-3 text-sm ${error?'text-red-500':''}`} style={{borderColor:'var(--cosmos-divider)',background:'var(--cosmos-card)'}}>{error||notice}</div>}

    <div className="grid md:grid-cols-[220px_1fr] gap-5">
      <aside className="md:sticky md:top-20 md:self-start rounded-2xl border p-2" style={{background:'var(--cosmos-card)',borderColor:'var(--cosmos-divider)'}}>{[['Home','#home'],['Personal info','#personal'],['Security','#security'],['Data & privacy','#privacy'],['Connected accounts','#connected'],['Products','#products'],['OTYA AI','#ai'],['Docs','/docs']].map(([label,href])=><a key={label} href={href} className="block rounded-xl px-3 py-2.5 text-sm hover:opacity-75">{label}</a>)}</aside>

      <div className="space-y-5">
        <section id="home" className="rounded-3xl border p-6" style={{background:'var(--cosmos-card)',borderColor:'var(--cosmos-divider)'}}><div className="flex flex-wrap justify-between gap-4"><div><h2 className="text-2xl font-bold">Welcome{user?.name?`, ${user.name}`:''}</h2><p className="text-sm opacity-60 mt-2">One account for OTYA Player, OTYA AI and future OTYA products.</p></div><div className="text-right text-sm"><div className="font-semibold">{user?.email}</div><div className="opacity-50">Account ID · {user?.id?.slice(0,8)}…</div></div></div></section>

        <section id="personal" className="rounded-3xl border p-6" style={{background:'var(--cosmos-card)',borderColor:'var(--cosmos-divider)'}}><h2 className="text-xl font-bold">Personal info</h2><p className="text-sm opacity-55 mt-1 mb-5">Only add information that helps you use or recover your OTYA account.</p><div className="grid sm:grid-cols-2 gap-3"><Field label="Name" value={editName} setValue={setEditName}/><Field label="Recovery email" value={recoveryEmail} setValue={setRecoveryEmail} type="email"/><Field label="Country / region code" value={country} setValue={setCountry} placeholder="UG"/><Field label="Language / locale" value={locale} setValue={setLocale} placeholder="en-UG"/><Field label="Timezone" value={timezone} setValue={setTimezone} placeholder="Africa/Kampala"/><div className="rounded-xl border p-3" style={{borderColor:'var(--cosmos-divider)'}}><div className="text-xs opacity-50">Primary email</div><div className="mt-1 text-sm">{user?.email}</div></div></div><button disabled={busy} onClick={()=>void saveProfile()} className="cosmos-button rounded-xl px-4 py-2.5 mt-4 text-sm font-semibold">Save personal info</button></section>

        <section id="security" className="rounded-3xl border p-6" style={{background:'var(--cosmos-card)',borderColor:'var(--cosmos-divider)'}}><h2 className="text-xl font-bold">Security</h2><div className="mt-5 space-y-5"><div className="rounded-2xl border p-4" style={{borderColor:'var(--cosmos-divider)'}}><div className="flex flex-wrap items-center justify-between gap-3"><div><strong>Email verification</strong><div className="text-sm opacity-55">{user?.is_verified?'Your primary email is verified.':'Verify your email for recovery and security notices.'}</div></div>{user?.is_verified?<span className="text-sm font-semibold">Verified</span>:<button onClick={()=>void sendEmailVerification()} className="rounded-xl border px-3 py-2 text-sm" style={{borderColor:'var(--cosmos-divider)'}}>Send code</button>}</div>{!user?.is_verified&&<div className="flex gap-2 mt-3"><input value={emailCode} onChange={e=>setEmailCode(e.target.value)} placeholder="A1234" className="flex-1 rounded-xl border bg-transparent px-3 py-2" style={{borderColor:'var(--cosmos-divider)'}}/><button onClick={()=>void verifyEmail()} className="cosmos-button rounded-xl px-4 text-sm font-semibold">Verify</button></div>}</div>

          <div className="rounded-2xl border p-4" style={{borderColor:'var(--cosmos-divider)'}}><div className="flex flex-wrap justify-between gap-3"><div><strong>Phone number</strong><div className="text-sm opacity-55">Optional. Useful for recovery and stronger account verification.</div></div>{user?.phone_verified_at&&<span className="text-sm font-semibold">Verified</span>}</div>{user?.phone_number&&<div className="mt-2 text-sm">{user.phone_number} <span className="opacity-45">· {user.phone_verification_method?.replaceAll('_',' ')}</span></div>}<div className="flex flex-wrap gap-2 mt-4"><button onClick={()=>void connectTelegram()} className="cosmos-button rounded-xl px-4 py-2 text-sm font-semibold">Verify with Telegram</button></div><div className="mt-4 border-t pt-4" style={{borderColor:'var(--cosmos-divider)'}}><div className="text-xs opacity-50 mb-2">Telegram code fallback</div><div className="flex flex-col sm:flex-row gap-2"><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+2567…" className="flex-1 rounded-xl border bg-transparent px-3 py-2" style={{borderColor:'var(--cosmos-divider)'}}/><button onClick={()=>void requestPhoneCode()} className="rounded-xl border px-4 py-2 text-sm" style={{borderColor:'var(--cosmos-divider)'}}>Send code</button></div>{phoneCodeSent&&<div className="flex gap-2 mt-2"><input value={phoneCode} onChange={e=>setPhoneCode(e.target.value)} placeholder="6-digit code" inputMode="numeric" className="flex-1 rounded-xl border bg-transparent px-3 py-2" style={{borderColor:'var(--cosmos-divider)'}}/><button onClick={()=>void verifyPhoneCode()} className="cosmos-button rounded-xl px-4 text-sm font-semibold">Verify</button></div>}</div></div>

          <div className="rounded-2xl border p-4" style={{borderColor:'var(--cosmos-divider)'}}><strong>Password & recovery</strong><p className="text-sm opacity-55 mt-1">Passwords are never displayed. Password reset uses a one-time code and revokes existing refresh tokens after a successful reset.</p><p className="text-xs opacity-45 mt-2">For stronger protection, passkeys/TOTP and detailed device-session controls are the next security layer; phone verification will not be the only recovery factor.</p></div></div></section>

        <section id="privacy" className="rounded-3xl border p-6" style={{background:'var(--cosmos-card)',borderColor:'var(--cosmos-divider)'}}><h2 className="text-xl font-bold">Data & privacy</h2><div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm"><StatusCard label="Terms" value={consent?.terms_accepted?'Accepted':'Review needed'}/><StatusCard label="Privacy" value={consent?.privacy_accepted?'Accepted':'Review needed'}/><StatusCard label="Marketing" value={consent?.marketing_consent?'On':'Off'}/></div><div className="flex flex-wrap gap-3 mt-4"><Link href="/docs" className="rounded-xl border px-4 py-2 text-sm font-semibold" style={{borderColor:'var(--cosmos-divider)'}}>Open Docs</Link><a href="mailto:support@petersmartlink.com?subject=OTYA%20Account%20Data%20Request" className="rounded-xl border px-4 py-2 text-sm font-semibold" style={{borderColor:'var(--cosmos-divider)'}}>Request my data</a></div></section>

        <section id="connected" className="rounded-3xl border p-6" style={{background:'var(--cosmos-card)',borderColor:'var(--cosmos-divider)'}}><h2 className="text-xl font-bold">Connected accounts</h2><p className="text-sm opacity-55 mt-1">External identities are linked without giving customers access to private OTYA admin tools.</p><div className="mt-4 space-y-2"><div className="rounded-xl border p-4 flex justify-between gap-4" style={{borderColor:'var(--cosmos-divider)'}}><div><strong>Telegram</strong><div className="text-xs opacity-50">{telegram?`Connected${telegram.provider_username?` as @${telegram.provider_username}`:''}`:'Not connected'}</div></div><button onClick={()=>void connectTelegram()} className="text-sm font-semibold">{telegram?'Reconnect':'Connect'}</button></div><div className="rounded-xl border p-4" style={{borderColor:'var(--cosmos-divider)'}}><strong>Google</strong><div className="text-xs opacity-50 mt-1">Google Sign-In remains an OTYA authentication option. Account linking is kept server-verified.</div></div></div></section>

        <section id="products" className="rounded-3xl border p-6" style={{background:'var(--cosmos-card)',borderColor:'var(--cosmos-divider)'}}><h2 className="text-xl font-bold">Your OTYA products</h2><p className="text-sm opacity-55 mt-1">Products share your account ID, not each other’s private databases.</p><div className="mt-4 rounded-xl border p-4 flex items-center justify-between" style={{borderColor:'var(--cosmos-divider)'}}><div><strong>OTYA Player</strong><div className="text-xs opacity-55">Media, playback, optional sync and support</div></div><Link href="/otya-player" className="text-sm font-semibold" style={{color:'var(--cosmos-primary)'}}>View</Link></div>{products.length>0&&<div className="mt-3 text-xs opacity-50">Recorded memberships: {products.map(p=>p.product_id).join(', ')}</div>}</section>

        <section id="ai" className="rounded-3xl border p-6" style={{background:'var(--cosmos-card)',borderColor:'var(--cosmos-divider)'}}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">OTYA AI</h2><p className="text-sm opacity-55">Choose your signed-in model preference.</p></div><Link href="/ai" className="rounded-xl border px-4 py-2 text-sm font-semibold" style={{borderColor:'var(--cosmos-divider)'}}>Open AI</Link></div><select value={model} onChange={e=>chooseModel(e.target.value)} className="mt-4 w-full sm:max-w-md rounded-xl border bg-transparent px-3 py-3" style={{borderColor:'var(--cosmos-divider)'}}>{models.map(m=><option key={m.id} value={m.id}>{m.name} · {m.provider}</option>)}</select>{models.find(m=>m.id===model)&&<p className="text-xs opacity-55 mt-2">{models.find(m=>m.id===model)?.description}</p>}</section>
      </div>
    </div>
  </div></main>
}

function Field({label,value,setValue,type='text',placeholder}:{label:string;value:string;setValue:(v:string)=>void;type?:string;placeholder?:string}){return <label className="rounded-xl border p-3 block" style={{borderColor:'var(--cosmos-divider)'}}><div className="text-xs opacity-50 mb-1">{label}</div><input type={type} value={value} onChange={e=>setValue(e.target.value)} placeholder={placeholder} className="w-full bg-transparent outline-none text-sm"/></label>}
function StatusCard({label,value}:{label:string;value:string}){return <div className="rounded-xl border p-4" style={{borderColor:'var(--cosmos-divider)'}}><div className="text-xs opacity-50">{label}</div><div className="font-semibold mt-1">{value}</div></div>}
