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

export function SiteNav() {
  const [user, setUser] = useState<User | null>(null)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountWrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    fetch('/api/account-session/session', { credentials: 'same-origin', cache: 'no-store' })
      .then(r => r.json())
      .then((data: Session) => { if (active) setUser(data.authenticated === true ? (data.user ?? {}) : null) })
      .catch(() => undefined)
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

  const signedIn = user !== null
  const avatar = user?.avatar_url?.trim()

  async function signOut() {
    await fetch('/api/account-session/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => undefined)
    setUser(null)
    setAccountOpen(false)
    window.location.assign('/')
  }

  return <header className="sticky top-0 z-50 border-b border-black/[.06] dark:border-white/[.08] bg-[color:var(--nav-bg)] backdrop-blur-2xl">
    <div className="otya-shell h-[64px] flex items-center gap-3">
      <Link href="/" className="inline-flex items-center gap-1.5 shrink-0" aria-label="Otya home">
        <OtyaBrandMark size={34} />
        <span className="font-black text-[19px] tracking-[-.045em] leading-none">tya</span>
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <Link href="/download/otya-player" className="hidden md:inline-flex min-h-10 items-center rounded-full px-4 text-[13px] font-extrabold otya-quiet-button">Get the app</Link>

        <Link href="/ask" aria-label="Open Otya" title="Otya" className="inline-flex min-h-11 min-w-11 items-center justify-center">
          <OtyaBrandMark size={34} thinking />
        </Link>

        <div ref={accountWrap} className="relative">
          <button
            type="button"
            onClick={() => signedIn ? setAccountOpen(value => !value) : window.location.assign('/sign-in')}
            aria-label={signedIn ? 'Open account menu' : 'Sign in'}
            aria-expanded={signedIn ? accountOpen : undefined}
            title={signedIn ? (user?.name || user?.email || 'Account') : 'Sign in'}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-black/[.08] bg-black/[.025] text-[color:var(--cosmos-text-primary)] transition hover:bg-black/[.055] dark:border-white/[.12] dark:bg-white/[.045] dark:hover:bg-white/[.08]"
          >
            {!signedIn ? <AccountGlyph /> : avatar ? <img src={avatar} alt="" width="40" height="40" referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : <span className="text-[12px] font-black tracking-[-.02em]">{initials(user ?? undefined)}</span>}
          </button>

          {signedIn && accountOpen && <div className="absolute right-0 mt-2 w-[280px] overflow-hidden rounded-[22px] border border-black/[.08] bg-[color:var(--cosmos-surface)] shadow-2xl dark:border-white/[.10]">
            <div className="px-4 py-4 border-b border-black/[.06] dark:border-white/[.08]">
              <div className="font-black truncate">{user?.name || 'Otya account'}</div>
              <div className="mt-1 text-xs otya-muted truncate">{user?.email}</div>
            </div>
            <div className="p-2 text-sm">
              <Link onClick={() => setAccountOpen(false)} href="/account" className="block rounded-xl px-3 py-2.5 font-bold hover:bg-black/[.04] dark:hover:bg-white/[.06]">Otya Space</Link>
              <Link onClick={() => setAccountOpen(false)} href="/account#personal" className="block rounded-xl px-3 py-2.5 hover:bg-black/[.04] dark:hover:bg-white/[.06]">Profile</Link>
              <Link onClick={() => setAccountOpen(false)} href="/account#security" className="block rounded-xl px-3 py-2.5 hover:bg-black/[.04] dark:hover:bg-white/[.06]">Security</Link>
              <Link onClick={() => setAccountOpen(false)} href="/account#sessions" className="block rounded-xl px-3 py-2.5 hover:bg-black/[.04] dark:hover:bg-white/[.06]">Sessions</Link>
              <Link onClick={() => setAccountOpen(false)} href="/help" className="block rounded-xl px-3 py-2.5 hover:bg-black/[.04] dark:hover:bg-white/[.06]">Help</Link>
              <button type="button" onClick={() => void signOut()} className="w-full text-left rounded-xl px-3 py-2.5 hover:bg-black/[.04] dark:hover:bg-white/[.06]">Sign out</button>
            </div>
          </div>}
        </div>
      </div>
    </div>
  </header>
}
