'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { OtyaBrandMark } from './OtyaBrandMark'

type User = { name?: string; email?: string; avatar_url?: string }
type Session = { authenticated?: boolean; user?: User }

const publicLinks = [['Home','/'],['Music','/music'],['App','/otya-player'],['Help','/help']] as const

function initials(user?: User) {
  const name = user?.name?.trim()
  if (name) return name.split(/\s+/).slice(0,2).map(p=>p[0]?.toUpperCase()).join('')
  return user?.email?.trim()?.[0]?.toUpperCase() || 'U'
}

function MenuGlyph(){return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>}
function CloseGlyph(){return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>}
function AccountGlyph(){return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.25"/><path d="M5.5 19c.75-3.2 3.1-5 6.5-5s5.75 1.8 6.5 5"/></svg>}
function SpaceGlyph(){return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M9.5 20v-6h5v6"/></svg>}

export function SiteNav(){
  const [user,setUser]=useState<User|null>(null)
  const [checked,setChecked]=useState(false)
  const [menuOpen,setMenuOpen]=useState(false)
  const [accountOpen,setAccountOpen]=useState(false)
  const accountWrap=useRef<HTMLDivElement>(null)

  useEffect(()=>{let active=true;fetch('/api/account-session/session',{credentials:'same-origin',cache:'no-store'}).then(async r=>{const d=await r.json().catch(()=>({})) as Session;if(!active)return;setUser(r.ok&&d.authenticated===true?(d.user??{}):null);setChecked(true)}).catch(()=>{if(active){setUser(null);setChecked(true)}});return()=>{active=false}},[])
  useEffect(()=>{if(!accountOpen)return;const close=(e:MouseEvent)=>{if(accountWrap.current&&!accountWrap.current.contains(e.target as Node))setAccountOpen(false)};document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close)},[accountOpen])
  useEffect(()=>{if(!menuOpen)return;const old=document.body.style.overflow;document.body.style.overflow='hidden';const esc=(e:KeyboardEvent)=>{if(e.key==='Escape')setMenuOpen(false)};window.addEventListener('keydown',esc);return()=>{document.body.style.overflow=old;window.removeEventListener('keydown',esc)}},[menuOpen])

  const signedIn=checked&&user!==null
  const avatar=user?.avatar_url?.trim()
  async function signOut(){await fetch('/api/account-session/logout',{method:'POST',credentials:'same-origin'}).catch(()=>undefined);setUser(null);setAccountOpen(false);setMenuOpen(false);window.location.assign('/')}

  return <>
    <header className="sticky top-0 z-50 border-b border-black/[.06] dark:border-white/[.08] bg-[color:var(--nav-bg)] backdrop-blur-2xl">
      <div className="otya-shell h-16 flex items-center gap-2 sm:gap-3">
        <button onClick={()=>setMenuOpen(true)} aria-label="Open menu" className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/[.05] dark:hover:bg-white/[.06]"><MenuGlyph/></button>
        <Link href="/" className="inline-flex items-center gap-1.5 shrink-0" aria-label="Otya home"><OtyaBrandMark size={34}/><span className="font-black text-[19px] tracking-[-.045em]">tya</span></Link>
        <nav className="hidden md:flex ml-7 items-center gap-1" aria-label="Main navigation">{publicLinks.map(([label,href])=><Link key={href} href={href} className="min-h-10 inline-flex items-center rounded-full px-4 text-[13px] font-extrabold otya-muted hover:bg-black/[.045] dark:hover:bg-white/[.06]">{label}</Link>)}</nav>
        <div className="ml-auto flex items-center gap-2">
          {signedIn&&<Link href="/account" className="hidden sm:inline-flex min-h-10 items-center gap-2 rounded-full border border-black/[.08] dark:border-white/[.10] px-3.5 text-xs font-black hover:bg-black/[.04] dark:hover:bg-white/[.05]" aria-label="Open Otya Space"><SpaceGlyph/>Space</Link>}
          <Link href="/ask" aria-label="Open Next" title="Next" className="inline-flex min-h-11 items-center gap-2 rounded-full px-2.5 hover:bg-black/[.04] dark:hover:bg-white/[.05]"><OtyaBrandMark ai size={31}/><span className="hidden sm:inline text-xs font-black">Next</span></Link>
          <div ref={accountWrap} className="relative">
            <button onClick={()=>signedIn?setAccountOpen(v=>!v):window.location.assign('/sign-in')} aria-label={signedIn?'Open account menu':'Sign in'} className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-black/[.08] dark:border-white/[.10] bg-black/[.025] dark:bg-white/[.04]">
              {!signedIn?<AccountGlyph/>:avatar?<img src={avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer"/>:<span className="text-xs font-black">{initials(user??undefined)}</span>}
            </button>
            {signedIn&&accountOpen&&<div className="absolute right-0 mt-2 w-[280px] overflow-hidden rounded-[22px] border border-black/[.08] dark:border-white/[.10] bg-[color:var(--cosmos-surface)] shadow-2xl">
              <div className="px-4 py-4 border-b border-black/[.06] dark:border-white/[.08]"><div className="font-black truncate">{user?.name||'Otya account'}</div><div className="mt-1 text-xs otya-muted truncate">{user?.email}</div></div>
              <div className="p-2 text-sm"><Link href="/account#personal" onClick={()=>setAccountOpen(false)} className="block rounded-xl px-3 py-2.5 font-bold hover:bg-black/[.04] dark:hover:bg-white/[.06]">Manage account</Link><button onClick={()=>void signOut()} className="w-full text-left rounded-xl px-3 py-2.5 text-red-500 hover:bg-black/[.04] dark:hover:bg-white/[.06]">Sign out</button></div>
            </div>}
          </div>
        </div>
      </div>
    </header>

    <div className={`fixed inset-0 z-[70] md:hidden ${menuOpen?'pointer-events-auto':'pointer-events-none'}`} aria-hidden={!menuOpen}>
      <button onClick={()=>setMenuOpen(false)} aria-label="Close menu" className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity ${menuOpen?'opacity-100':'opacity-0'}`}/>
      <aside className={`absolute inset-y-0 left-0 w-[86vw] max-w-[340px] border-r border-black/[.08] dark:border-white/[.10] bg-[color:var(--cosmos-surface)] shadow-2xl transition-transform ${menuOpen?'translate-x-0':'-translate-x-full'}`}>
        <div className="h-16 flex items-center px-4 border-b border-black/[.06] dark:border-white/[.08]"><Link href="/" onClick={()=>setMenuOpen(false)} className="inline-flex items-center gap-1.5"><OtyaBrandMark size={34}/><span className="font-black text-[19px]">tya</span></Link><button onClick={()=>setMenuOpen(false)} aria-label="Close menu" className="ml-auto h-10 w-10 grid place-items-center rounded-full"><CloseGlyph/></button></div>
        <div className="p-4 text-sm">
          {signedIn&&<div className="space-y-1 pb-4 border-b border-black/[.06] dark:border-white/[.08]"><Link href="/account" onClick={()=>setMenuOpen(false)} className="flex items-center gap-3 rounded-2xl px-3 py-3 font-black bg-black/[.035] dark:bg-white/[.05]"><SpaceGlyph/>Otya Space</Link><Link href="/ask" onClick={()=>setMenuOpen(false)} className="flex items-center gap-3 rounded-2xl px-3 py-3 font-black"><OtyaBrandMark ai size={28}/>Next</Link></div>}
          <div className={`${signedIn?'pt-4':''} space-y-1`}>{signedIn&&<div className="px-3 pb-2 text-[11px] font-black uppercase tracking-[.14em] otya-muted">Explore Otya</div>}{publicLinks.map(([label,href])=><Link key={href} href={href} onClick={()=>setMenuOpen(false)} className="block rounded-2xl px-3 py-3 font-bold hover:bg-black/[.045] dark:hover:bg-white/[.06]">{label}</Link>)}</div>
          {signedIn?<button onClick={()=>void signOut()} className="mt-4 w-full text-left rounded-2xl px-3 py-3 text-red-500">Sign out</button>:<><Link href="/ask" onClick={()=>setMenuOpen(false)} className="mt-3 flex items-center gap-3 rounded-2xl px-3 py-3 font-black bg-black/[.025] dark:bg-white/[.04]"><OtyaBrandMark ai size={28}/>Next</Link><Link href="/sign-in" onClick={()=>setMenuOpen(false)} className="cosmos-button mt-4 flex min-h-11 items-center justify-center rounded-full px-4 font-black">Sign in</Link></>}
        </div>
      </aside>
    </div>
  </>
}
