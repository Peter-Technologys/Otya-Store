'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { OtyaBrandMark } from './OtyaBrandMark'

type User = { name?: string; email?: string; avatar_url?: string }
type Session = { authenticated?: boolean; user?: User }

function initials(user?: User) {
  const name = user?.name?.trim()
  if (name) return name.split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('')
  const email = user?.email?.trim()
  return email?.[0]?.toUpperCase() || 'U'
}

function AccountGlyph() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.25"/><path d="M5.5 19c.75-3.2 3.1-5 6.5-5s5.75 1.8 6.5 5"/></svg>
}

function MenuGlyph() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
}

function CloseGlyph() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>
}

const publicLinks = [
  ['Home', '/'],
  ['App', '/otya-player'],
  ['Music', '/music'],
] as const

export function SiteNav() {
  const [user, setUser] = useState<User | null>(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const accountWrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    fetch('/api/account-session/session', { credentials: 'same-origin', cache: 'no-store' })
      .then(async response => {
        const data = await response.json().catch(() => ({})) as Session
        if (!active) return
        setUser(response.ok && data.authenticated === true ? (data.user ?? {}) : null)
        setSessionChecked(true)
      })
      .catch(() => { if (active) { setUser(null); setSessionChecked(true) } })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!accountOpen) return
    const close = (event: MouseEvent) => {
      if (accountWrap.current && !accountWrap.current.contains(event.target as Node)) setAccountOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [accountOpen])

  useEffect(() => {
    if (!menuOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuOpen])

  const signedIn = sessionChecked && user !== null
  const avatar = user?.avatar_url?.trim()

  async function signOut() {
    await fetch('/api/account-session/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => undefined)
    setUser(null)
    setAccountOpen(false)
    setMenuOpen(false)
    window.location.assign('/')
  }

  return <>
    <header className="sticky top-0 z-50 border-b border-black/[.06] dark:border-white/[.08] bg-[color:var(--nav-bg)] backdrop-blur-2xl">
      <div className="otya-shell h-[64px] flex items-center gap-2 sm:gap-3">
        <button type="button" onClick={() => { setAccountOpen(false); setMenuOpen(true) }} aria-label="Open menu" aria-expanded={menuOpen} className="md:hidden inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-black/[.05] dark:hover:bg-white/[.07]">
          <MenuGlyph />
        </button>

        <Link href={signedIn ? '/account' : '/'} className="inline-flex items-center gap-1.5 shrink-0" aria-label={signedIn ? 'Otya Space' : 'Otya home'}>
          <OtyaBrandMark size={34} />
          <span className="font-black text-[19px] tracking-[-.045em] leading-none">tya</span>
        </Link>

        {!signedIn && <nav className="hidden md:flex items-center gap-1 ml-7" aria-label="Main navigation">
          {publicLinks.map(([label, href]) => <Link key={href} href={href} className="min-h-10 inline-flex items-center rounded-full px-4 text-[13px] font-extrabold otya-muted transition hover:bg-black/[.045] hover:text-[color:var(--cosmos-text-primary)] dark:hover:bg-white/[.06]">{label}</Link>)}
        </nav>}

        {signedIn && <div className="hidden md:block ml-5 text-xs font-bold otya-muted">Otya Space</div>}

        <div className="ml-auto flex items-center gap-2">
          {!signedIn && <Link href="/ask" aria-label="Open Otya" title="Otya" className="inline-flex min-h-11 min-w-11 items-center justify-center"><OtyaBrandMark size={34} thinking /></Link>}

          <div ref={accountWrap} className="relative">
            <button type="button" onClick={() => signedIn ? setAccountOpen(value => !value) : window.location.assign('/sign-in')} aria-label={signedIn ? 'Open account menu' : 'Sign in'} aria-expanded={signedIn ? accountOpen : undefined} title={signedIn ? (user?.name || user?.email || 'Account') : 'Sign in'} className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-black/[.08] bg-black/[.025] transition hover:bg-black/[.055] dark:border-white/[.12] dark:bg-white/[.045] dark:hover:bg-white/[.08]">
              {!signedIn ? <AccountGlyph /> : avatar ? <img src={avatar} alt="" width="40" height="40" referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : <span className="text-[12px] font-black tracking-[-.02em]">{initials(user ?? undefined)}</span>}
            </button>

            {signedIn && accountOpen && <div className="absolute right-0 mt-2 w-[280px] overflow-hidden rounded-[22px] border border-black/[.08] bg-[color:var(--cosmos-surface)] shadow-2xl dark:border-white/[.10]">
              <div className="px-4 py-4 border-b border-black/[.06] dark:border-white/[.08]">
                <div className="font-black truncate">{user?.name || 'Otya account'}</div>
                <div className="mt-1 text-xs otya-muted truncate">{user?.email}</div>
              </div>
              <div className="p-2 text-sm">
                <Link onClick={() => setAccountOpen(false)} href="/account" className="block rounded-xl px-3 py-2.5 font-bold hover:bg-black/[.04] dark:hover:bg-white/[.06]">Open Otya Space</Link>
                <button type="button" onClick={() => void signOut()} className="w-full text-left rounded-xl px-3 py-2.5 text-red-500 hover:bg-black/[.04] dark:hover:bg-white/[.06]">Sign out</button>
              </div>
            </div>}
          </div>
        </div>
      </div>
    </header>

    <div className={`fixed inset-0 z-[70] transition md:hidden ${menuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!menuOpen}>
      <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" tabIndex={menuOpen ? 0 : -1} className={`absolute inset-0 bg-black/35 backdrop-blur-[2px] transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0'}`} />
      <aside role="dialog" aria-modal="true" aria-label="Otya menu" className={`absolute inset-y-0 left-0 w-[86vw] max-w-[340px] border-r border-black/[.08] bg-[color:var(--cosmos-surface)] shadow-2xl transition-transform duration-300 ease-out dark:border-white/[.10] ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center gap-2 border-b border-black/[.06] px-4 dark:border-white/[.08]">
          <Link href={signedIn ? '/account' : '/'} onClick={() => setMenuOpen(false)} className="inline-flex items-center gap-1.5"><OtyaBrandMark size={34}/><span className="font-black text-[19px] tracking-[-.045em]">tya</span></Link>
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/[.05] dark:hover:bg-white/[.07]"><CloseGlyph /></button>
        </div>

        <div className="h-[calc(100dvh-64px)] overflow-y-auto px-3 py-4">
          {!signedIn ? <>
            <nav className="space-y-1 text-sm" aria-label="Otya navigation">
              {publicLinks.map(([label, href]) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="block rounded-2xl px-3 py-3 font-bold hover:bg-black/[.045] dark:hover:bg-white/[.06]">{label}</Link>)}
              <Link href="/help" onClick={() => setMenuOpen(false)} className="block rounded-2xl px-3 py-3 hover:bg-black/[.045] dark:hover:bg-white/[.06]">Help</Link>
            </nav>
            <div className="mt-5 px-3"><Link href="/sign-in" onClick={() => setMenuOpen(false)} className="cosmos-button flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-black">Sign in</Link></div>
          </> : <>
            <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-[.14em] otya-muted">Signed in</div>
            <nav className="space-y-1 text-sm" aria-label="Signed-in navigation">
              <Link href="/account" onClick={() => setMenuOpen(false)} className="block rounded-2xl px-3 py-3 font-bold hover:bg-black/[.045] dark:hover:bg-white/[.06]">Open Otya Space</Link>
              <Link href="/" onClick={() => setMenuOpen(false)} className="block rounded-2xl px-3 py-3 hover:bg-black/[.045] dark:hover:bg-white/[.06]">Public Otya site</Link>
              <button type="button" onClick={() => void signOut()} className="w-full text-left rounded-2xl px-3 py-3 text-red-500 hover:bg-black/[.045] dark:hover:bg-white/[.06]">Sign out</button>
            </nav>
          </>}
        </div>
      </aside>
    </div>
  </>
}
