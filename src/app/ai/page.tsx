'use client'

import {useEffect,useRef,useState} from 'react'
import Link from 'next/link'

type Message={role:'user'|'assistant';content:string}
type User={id:string;email:string;name?:string|null}
type Conversation={id:string;title:string;created_at:string;updated_at:string}
type Model={id:string;name:string;provider:string;tier:string;description:string;guest?:boolean}
type Quota={limit:number;used:number;remaining:number;global_limit?:number;global_used?:number}

export default function OtyaAiPage(){
  const[guest,setGuest]=useState('')
  const[conversation,setConversation]=useState('')
  const[conversations,setConversations]=useState<Conversation[]>([])
  const[messages,setMessages]=useState<Message[]>([])
  const[input,setInput]=useState('')
  const[busy,setBusy]=useState(false)
  const[error,setError]=useState('')
  const[token,setToken]=useState('')
  const[user,setUser]=useState<User|null>(null)
  const[email,setEmail]=useState('')
  const[password,setPassword]=useState('')
  const[showLogin,setShowLogin]=useState(false)
  const[authBusy,setAuthBusy]=useState(false)
  const[twoFactor,setTwoFactor]=useState(false)
  const[recoveryMode,setRecoveryMode]=useState(false)
  const[factorCode,setFactorCode]=useState('')
  const[models,setModels]=useState<Model[]>([])
  const[model,setModel]=useState('llama-fast')
  const[sidebar,setSidebar]=useState(false)
  const[forceNew,setForceNew]=useState(false)
  const[quota,setQuota]=useState<Quota|null>(null)
  const scrollRef=useRef<HTMLDivElement>(null)
  const textRef=useRef<HTMLTextAreaElement>(null)

  useEffect(()=>{
    let g=localStorage.getItem('otya_ai_guest')||''
    if(!g){g=crypto.randomUUID()+crypto.randomUUID();localStorage.setItem('otya_ai_guest',g)}
    setGuest(g)
    const t=sessionStorage.getItem('otya_access_token')||''
    const raw=sessionStorage.getItem('otya_ai_user')
    if(t){setToken(t);try{if(raw)setUser(JSON.parse(raw))}catch{}}
    setConversation(t?(localStorage.getItem('otya_ai_conversation')||''):'')
  },[])

  useEffect(()=>{if(guest)void loadModels();if(token)void loadChats()},[token,guest])
  useEffect(()=>{if(token&&conversation)void loadConversation(conversation)},[token,conversation])
  useEffect(()=>{requestAnimationFrame(()=>{const el=scrollRef.current;if(el)el.scrollTo({top:el.scrollHeight,behavior:'smooth'})})},[messages,busy])

  function authHeaders(){const h:Record<string,string>={};if(token)h.Authorization=`Bearer ${token}`;return h}

  async function loadModels(){
    try{
      const suffix=guest?`&guest_id=${encodeURIComponent(guest)}`:''
      const r=await fetch(`/api/ai/chat?models=1${suffix}`,{headers:authHeaders(),cache:'no-store'})
      const d=await r.json()
      if(!r.ok)return
      setModels(d.models||[]);setQuota(d.quota||null)
      const saved=localStorage.getItem('otya_ai_model')||d.default_model||d.guest_model||'llama-fast'
      const allowed=(d.models||[]).some((m:Model)=>m.id===saved)
      setModel(allowed?saved:(d.default_model||d.guest_model||'llama-fast'))
    }catch{}
  }

  async function loadChats(){
    try{const r=await fetch('/api/ai/chat?list=1',{headers:authHeaders(),cache:'no-store'}),d=await r.json();if(r.ok)setConversations(d.conversations||[])}catch{}
  }

  async function loadConversation(id:string){
    try{
      const r=await fetch(`/api/ai/chat?conversation_id=${encodeURIComponent(id)}`,{headers:authHeaders(),cache:'no-store'}),d=await r.json()
      if(!r.ok)return
      setMessages((d.conversation?.messages||[]).map((x:Message)=>({role:x.role,content:x.content})))
      setConversation(id);localStorage.setItem('otya_ai_conversation',id);setForceNew(false);setSidebar(false)
    }catch{}
  }

  function resetLoginChallenge(){setTwoFactor(false);setRecoveryMode(false);setFactorCode('')}

  async function login(e:React.FormEvent){
    e.preventDefault();if(!email.trim()||!password)return
    if(twoFactor&&!factorCode.trim())return
    setAuthBusy(true);setError('')
    try{
      const payload:Record<string,string>={email:email.trim(),password}
      if(twoFactor){payload[recoveryMode?'recovery_code':'totp_code']=factorCode.trim()}
      const r=await fetch('/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      const d=await r.json().catch(()=>({}))
      if(!r.ok){
        if(d.code==='TWO_FACTOR_REQUIRED'||d.code==='TWO_FACTOR_INVALID'){
          setTwoFactor(true);setFactorCode('');throw new Error(d.code==='TWO_FACTOR_INVALID'?'That verification code was not accepted. Try again.':'Enter your authenticator code to continue.')
        }
        throw new Error(d.error||'Sign in failed')
      }
      sessionStorage.setItem('otya_access_token',d.access_token)
      sessionStorage.setItem('otya_refresh_token',d.refresh_token||'')
      sessionStorage.setItem('otya_ai_user',JSON.stringify(d.user||{}))
      setToken(d.access_token);setUser(d.user||null);setShowLogin(false);setMessages([]);setConversation('');setForceNew(true);setPassword('');resetLoginChallenge()
    }catch(e){setError((e as Error).message)}finally{setAuthBusy(false)}
  }

  async function logout(){
    const refresh=sessionStorage.getItem('otya_refresh_token')||''
    try{if(refresh)await fetch('/auth/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refresh_token:refresh})})}catch{}
    sessionStorage.removeItem('otya_access_token');sessionStorage.removeItem('otya_refresh_token');sessionStorage.removeItem('otya_ai_user')
    setToken('');setUser(null);setConversation('');setConversations([]);setMessages([]);setModel('llama-fast');setQuota(null)
  }

  async function send(){
    const text=input.trim();if(!text||!guest||busy)return
    const history=messages.slice(-20)
    setInput('');setMessages(v=>[...v,{role:'user',content:text}]);setBusy(true);setError('')
    try{
      const h=new Headers({'Content-Type':'application/json'});if(token)h.set('Authorization',`Bearer ${token}`)
      const r=await fetch('/api/ai/chat',{method:'POST',headers:h,body:JSON.stringify({message:text,guest_id:guest,conversation_id:token&&conversation?conversation:undefined,new_chat:Boolean(token&&forceNew),model:token?model:undefined,history:token?undefined:history})})
      const d=await r.json().catch(()=>({}))
      if(d.quota)setQuota(d.quota)
      if(!r.ok)throw new Error(d.error||'OTYA AI is unavailable')
      if(token&&d.conversation_id){setConversation(d.conversation_id);localStorage.setItem('otya_ai_conversation',d.conversation_id);setForceNew(false);void loadChats()}
      setMessages(v=>[...v,{role:'assistant',content:d.answer||'I could not answer that.'}])
    }catch(e){setError((e as Error).message)}finally{setBusy(false);textRef.current?.focus()}
  }

  function newChat(){if(token)localStorage.removeItem('otya_ai_conversation');setConversation('');setMessages([]);setError('');setForceNew(Boolean(token));setSidebar(false);setTimeout(()=>textRef.current?.focus(),50)}
  function chooseModel(id:string){if(!token)return;setModel(id);localStorage.setItem('otya_ai_model',id)}
  const selected=models.find(x=>x.id===model)
  const quotaPercent=quota?Math.max(0,Math.min(100,(quota.remaining/Math.max(1,quota.limit))*100)):0

  return <main className="h-[100dvh] overflow-hidden flex" style={{background:'var(--cosmos-scaffold)',color:'var(--cosmos-text-primary)'}}>
    {sidebar&&<button aria-label="Close sidebar" className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={()=>setSidebar(false)}/>} 

    <aside className={`${sidebar?'translate-x-0':'-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-40 w-[246px] shrink-0 border-r transition-transform duration-150 flex flex-col`} style={{background:'var(--cosmos-surface)',borderColor:'var(--cosmos-divider)'}}>
      <div className="h-13 px-3 flex items-center gap-2 border-b" style={{borderColor:'var(--cosmos-divider)'}}>
        <Link href="/" className="font-semibold text-sm tracking-tight">OTYA AI</Link>
        <button className="ml-auto md:hidden text-lg" onClick={()=>setSidebar(false)}>×</button>
      </div>
      <div className="p-2.5"><button onClick={newChat} className="w-full rounded-lg border px-3 py-2 text-left text-sm font-medium" style={{borderColor:'var(--cosmos-divider)'}}>New chat</button></div>

      {quota&&<div className="mx-2.5 mb-2 px-3 py-2.5 rounded-lg border text-xs" style={{borderColor:'var(--cosmos-divider)'}}>
        <div className="flex justify-between"><span className="otya-muted">Daily credits</span><span className="font-semibold">{quota.remaining}/{quota.limit}</span></div>
        <div className="mt-2 h-1 rounded-full overflow-hidden" style={{background:'var(--cosmos-divider)'}}><div className="h-full" style={{width:`${quotaPercent}%`,background:'var(--cosmos-primary)'}}/></div>
      </div>}

      <div className="px-3 pt-3 pb-2 text-[10px] uppercase tracking-[.12em] otya-muted">{token?'Chats':'Guest'}</div>
      <div className="flex-1 overflow-y-auto px-1.5">
        {token?conversations.map(c=><button key={c.id} onClick={()=>void loadConversation(c.id)} className="w-full text-left px-2.5 py-2 rounded-lg text-[13px] truncate mb-0.5" style={{background:conversation===c.id?'color-mix(in srgb, var(--cosmos-text-primary) 6%, transparent)':'transparent',fontWeight:conversation===c.id?600:450}}>{c.title||'New chat'}</button>):<div className="px-2.5 py-2 text-xs leading-5 otya-muted">Temporary chat. Sign in to save conversations and choose models.</div>}
      </div>

      <div className="p-2 border-t text-[13px]" style={{borderColor:'var(--cosmos-divider)'}}>
        <Link href="/account" className="block rounded-lg px-2.5 py-2">Account</Link>
        <Link href="/docs" className="block rounded-lg px-2.5 py-2">Docs</Link>
        <Link href="/apps" className="block rounded-lg px-2.5 py-2">Products</Link>
        {user?<><div className="px-2.5 pt-2 pb-1 text-[11px] truncate otya-muted">{user.email}</div><button onClick={logout} className="w-full text-left rounded-lg px-2.5 py-2">Sign out</button></>:<button onClick={()=>{setShowLogin(true);setError('');resetLoginChallenge()}} className="w-full text-left rounded-lg px-2.5 py-2 font-semibold">Sign in</button>}
      </div>
    </aside>

    <section className="min-w-0 flex-1 flex flex-col relative">
      <header className="h-13 shrink-0 px-3 sm:px-4 flex items-center border-b" style={{borderColor:'var(--cosmos-divider)',background:'var(--cosmos-app-bar)'}}>
        <button className="md:hidden w-8 h-8 rounded-lg mr-1" onClick={()=>setSidebar(true)}>☰</button>
        <div className="md:hidden font-semibold text-sm">OTYA AI</div>
        {token?<select aria-label="AI model" value={model} onChange={e=>chooseModel(e.target.value)} className="ml-auto md:ml-0 max-w-[210px] bg-transparent border rounded-lg px-2.5 py-1.5 text-[13px]" style={{borderColor:'var(--cosmos-divider)'}}>{models.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select>:<button onClick={()=>{setShowLogin(true);setError('');resetLoginChallenge()}} className="ml-auto md:ml-0 text-xs rounded-lg border px-2.5 py-1.5" style={{borderColor:'var(--cosmos-divider)'}}>OTYA Fast · Sign in</button>}
        <div className="ml-auto hidden md:flex items-center gap-3 text-[11px] otya-muted">{quota&&<span>{quota.remaining} credits</span>}{selected&&<span>{selected.provider}</span>}</div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="otya-reading pt-6 pb-32">
          {messages.length===0?<div className="min-h-[56vh] flex flex-col justify-center">
            <div className="otya-kicker mb-3">OTYA AI</div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-.04em] max-w-xl">What can I help with?</h1>
            <p className="mt-3 max-w-lg text-sm sm:text-[15px] otya-muted">Ask about anything. OTYA questions get product-aware help; signed-in chats can use your selected model.</p>
            <div className="grid sm:grid-cols-2 gap-px mt-7 border rounded-xl overflow-hidden" style={{borderColor:'var(--cosmos-divider)',background:'var(--cosmos-divider)'}}>
              {['Explain something I am learning','Help me write a professional message','Plan my day','Help with OTYA Player'].map(x=><button key={x} onClick={()=>{setInput(x);setTimeout(()=>textRef.current?.focus(),20)}} className="p-3.5 text-left text-sm" style={{background:'var(--cosmos-card)'}}>{x}</button>)}
            </div>
          </div>:
          <div className="space-y-8">
            {messages.map((m,i)=>m.role==='user'?<div key={i} className="flex justify-end"><div className="max-w-[84%] rounded-2xl px-4 py-2.5 text-[15px] whitespace-pre-wrap" style={{background:'color-mix(in srgb, var(--cosmos-text-primary) 7%, var(--cosmos-card))'}}>{m.content}</div></div>:<article key={i}><div className="text-[11px] font-semibold mb-2 otya-muted">OTYA</div><div className="whitespace-pre-wrap text-[15px] sm:text-[16px] leading-7">{m.content}</div><button onClick={()=>navigator.clipboard?.writeText(m.content)} className="mt-2 text-xs otya-muted">Copy</button></article>)}
            {busy&&<div><div className="text-[11px] font-semibold mb-2 otya-muted">OTYA</div><div className="text-sm otya-muted animate-pulse">Thinking…</div></div>}
            {error&&<div className="border rounded-lg px-3 py-2.5 text-sm text-red-500" style={{borderColor:'color-mix(in srgb, var(--cosmos-error) 35%, transparent)'}}>{error}</div>}
          </div>}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 px-3 sm:px-4 pb-[max(10px,env(safe-area-inset-bottom))] pt-6" style={{background:'linear-gradient(to top,var(--cosmos-scaffold) 72%,transparent)'}}>
        <div className="otya-reading">
          <div className="rounded-2xl border p-1.5 flex items-end" style={{background:'var(--cosmos-card)',borderColor:'var(--cosmos-divider)'}}>
            <textarea ref={textRef} rows={1} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();void send()}}} className="min-h-10 max-h-36 flex-1 resize-none bg-transparent outline-none px-3 py-2 text-[15px] leading-6" placeholder="Message OTYA AI"/>
            <button aria-label="Send" onClick={()=>void send()} disabled={busy||!input.trim()} className="cosmos-button w-9 h-9 rounded-xl grid place-items-center text-sm disabled:opacity-30">↑</button>
          </div>
          <p className="text-[10px] otya-muted text-center mt-1.5">AI can make mistakes. {token?'Chats are saved to your account.':'Guest chats are temporary.'}</p>
        </div>
      </div>
    </section>

    {showLogin&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onMouseDown={e=>{if(e.currentTarget===e.target)setShowLogin(false)}}>
      <form onSubmit={login} className="w-full max-w-sm rounded-2xl border p-5" style={{background:'var(--cosmos-card)',borderColor:'var(--cosmos-divider)'}}>
        <div className="flex justify-between items-center"><div><div className="otya-kicker mb-1">OTYA Account</div><h2 className="text-xl font-semibold">{twoFactor?'Verify it’s you':'Sign in'}</h2></div><button type="button" onClick={()=>setShowLogin(false)} className="w-8 h-8 rounded-lg">×</button></div>
        <p className="text-sm otya-muted mt-2 mb-4">{twoFactor?(recoveryMode?'Enter one of your unused recovery codes.':'Enter the 6-digit code from your authenticator app.'):'Save chats, choose models and continue conversations across OTYA.'}</p>
        {error&&<div className="mb-3 text-sm text-red-500">{error}</div>}
        {!twoFactor?<>
          <input type="email" autoComplete="email" className="w-full rounded-lg border bg-transparent px-3 py-2.5 mb-2.5" style={{borderColor:'var(--cosmos-divider)'}} placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
          <input type="password" autoComplete="current-password" className="w-full rounded-lg border bg-transparent px-3 py-2.5" style={{borderColor:'var(--cosmos-divider)'}} placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/>
        </>:<input autoFocus inputMode={recoveryMode?'text':'numeric'} autoComplete="one-time-code" className="w-full rounded-lg border bg-transparent px-3 py-3 text-center tracking-[.16em]" style={{borderColor:'var(--cosmos-divider)'}} placeholder={recoveryMode?'Recovery code':'000000'} value={factorCode} onChange={e=>setFactorCode(recoveryMode?e.target.value:e.target.value.replace(/\D/g,'').slice(0,6))}/>} 
        <button disabled={authBusy} className="cosmos-button w-full rounded-lg py-2.5 mt-3 text-sm font-semibold">{authBusy?'Checking…':twoFactor?'Continue':'Sign in'}</button>
        {twoFactor&&<button type="button" onClick={()=>{setRecoveryMode(v=>!v);setFactorCode('');setError('')}} className="w-full mt-2 text-xs otya-muted">{recoveryMode?'Use authenticator code':'Use a recovery code instead'}</button>}
        <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs" style={{borderColor:'var(--cosmos-divider)'}}><Link href="/account" className="otya-muted">Manage account</Link><Link href="/docs" className="otya-muted">Docs</Link></div>
      </form>
    </div>}
  </main>
}
