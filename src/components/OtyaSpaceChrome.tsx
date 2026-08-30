'use client'

import Link from 'next/link'
import { ReactNode, useEffect, useRef, useState } from 'react'

type SpaceUser = {
  email?: string
  name?: string | null
  avatar_url?: string | null
  otya_id?: string | null
}

type SessionPayload = {
  authenticated?: boolean
  user?: SpaceUser
}

const MAIN_NAV = [
  ['Overview', '#overview', '⌂'],
  ['My Otya', '#personal', '◉'],
  ['Security', '#security', '◇'],
  ['Devices & sessions', '#sessions', '▣'],
  ['Connected accounts', '#connected', '◎'],
  ['Storage & backup', '#storage', '▤'],
  ['Activity', '#activity', '↻'],
  ['Notifications', '#notifications', '♢'],
  ['Otya AI', '/ask', '✦'],
  ['Settings', '#settings', '⚙'],
] as const

export function OtyaSpaceChrome({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SpaceUser | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    void fetch('/api/account-session/session', {
      cache: 'no-store',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    }).then(async response => {
      const data = await response.json().catch(() => ({})) as SessionPayload
      if (!cancelled && response.ok && data.authenticated === true) setUser(data.user ?? {})
    }).catch(() => undefined)
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    function closeOnOutside(event: MouseEvent) {
      const node = event.target as Node
      if (profileOpen && !profileRef.current?.contains(node)) setProfileOpen(false)
      if (notificationsOpen && !notificationRef.current?.contains(node)) setNotificationsOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutside)
    return () => document.removeEventListener('mousedown', closeOnOutside)
  }, [profileOpen, notificationsOpen])

  const displayName = user?.name?.trim() || user?.email?.split('@')[0] || 'Otya user'
  const initials = displayName.slice(0, 2).toUpperCase()

  return <div className="min-h-screen" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
    <header className="sticky top-0 z-50 h-16 border-b" style={{ background: 'color-mix(in srgb,var(--cosmos-scaffold) 94%,transparent)', borderColor: 'var(--cosmos-divider)', backdropFilter: 'blur(18px)' }}>
      <div className="h-full flex items-center gap-3 px-3 sm:px-5">
        <button type="button" aria-label="Open Otya Space navigation" onClick={() => setMobileNavOpen(true)} className="lg:hidden h-10 w-10 grid place-items-center rounded-xl hover:bg-white/5">☰</button>
        <Link href="/account#overview" className="flex items-center gap-2.5 min-w-0">
          <img src="/web-app-manifest-192x192.png" alt="OTYA" className="h-9 w-9 rounded-xl" />
          <div className="hidden sm:block leading-tight"><div className="font-black tracking-[-.02em]">Otya Space</div><div className="text-[11px] otya-muted">Your Otya console</div></div>
        </Link>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <div className="relative" ref={profileRef}>
            <button type="button" aria-label="Profile" title="Profile" onClick={() => { setProfileOpen(value => !value); setNotificationsOpen(false) }} className="h-10 min-w-10 rounded-full border grid place-items-center text-xs font-black overflow-hidden" style={{ borderColor: profileOpen ? 'var(--cosmos-primary)' : 'var(--cosmos-divider)', background: 'var(--cosmos-card)' }}>
              {user?.avatar_url ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover" /> : initials}
            </button>
            {profileOpen && <div className="absolute right-0 top-12 w-[min(360px,calc(100vw-24px))] max-h-[56vh] overflow-auto rounded-2xl border p-3 shadow-2xl" style={{ background: 'var(--cosmos-surface)', borderColor: 'var(--cosmos-divider)' }}>
              <div className="flex items-center gap-3 p-2.5">
                <div className="h-11 w-11 shrink-0 rounded-full grid place-items-center font-black" style={{ background: 'color-mix(in srgb,var(--cosmos-primary) 14%,var(--cosmos-card))' }}>{initials}</div>
                <div className="min-w-0"><div className="font-bold truncate">{displayName}</div><div className="text-xs otya-muted truncate">{user?.email || 'Otya account'}</div>{user?.otya_id && <div className="mt-1 text-[11px] font-mono otya-muted">{user.otya_id}</div>}</div>
              </div>
              <div className="my-2 border-t" style={{ borderColor: 'var(--cosmos-divider)' }} />
              <MenuLink href="/account#personal" onClick={() => setProfileOpen(false)}>Manage account</MenuLink>
              <MenuLink href="/account#settings" onClick={() => setProfileOpen(false)}>Appearance & language</MenuLink>
              <div className="my-2 border-t" style={{ borderColor: 'var(--cosmos-divider)' }} />
              <button type="button" onClick={() => void signOut()} className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold hover:bg-white/5">Sign out</button>
            </div>}
          </div>

          <Link href="/ask" aria-label="Otya AI" title="Otya AI" className="h-10 w-10 grid place-items-center rounded-xl hover:bg-white/5 text-lg">✦</Link>

          <div className="relative" ref={notificationRef}>
            <button type="button" aria-label="Notifications" title="Notifications" onClick={() => { setNotificationsOpen(value => !value); setProfileOpen(false) }} className="relative h-10 w-10 grid place-items-center rounded-xl hover:bg-white/5 text-lg">♢<span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full" style={{ background: 'var(--cosmos-primary)' }} /></button>
            {notificationsOpen && <div className="absolute right-0 top-12 w-[min(360px,calc(100vw-24px))] max-h-[52vh] overflow-auto rounded-2xl border p-4 shadow-2xl" style={{ background: 'var(--cosmos-surface)', borderColor: 'var(--cosmos-divider)' }}>
              <div className="flex items-center justify-between gap-3"><strong>Notifications</strong><Link href="/account#notifications" onClick={() => setNotificationsOpen(false)} className="text-xs font-semibold otya-muted">View all</Link></div>
              <div className="mt-4 rounded-xl border p-4 text-sm" style={{ borderColor: 'var(--cosmos-divider)' }}><div className="font-semibold">You’re up to date</div><p className="mt-1 text-xs otya-muted">Security notices, account activity and Otya updates will appear here.</p></div>
            </div>}
          </div>

          <Link href="/help" aria-label="Help" title="Help" className="h-10 w-10 grid place-items-center rounded-xl hover:bg-white/5 text-sm font-black">?</Link>
        </div>
      </div>
    </header>

    <div className="lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="hidden lg:block border-r min-h-[calc(100vh-64px)]" style={{ borderColor: 'var(--cosmos-divider)' }}>
        <SpaceNav />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>

    {mobileNavOpen && <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Otya Space navigation">
      <button type="button" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} className="absolute inset-0 bg-black/45" />
      <aside className="relative h-full w-[min(310px,84vw)] border-r shadow-2xl" style={{ background: 'var(--cosmos-scaffold)', borderColor: 'var(--cosmos-divider)' }}>
        <div className="h-16 flex items-center justify-between px-4 border-b" style={{ borderColor: 'var(--cosmos-divider)' }}><strong>Otya Space</strong><button type="button" onClick={() => setMobileNavOpen(false)} className="h-9 w-9 rounded-xl">×</button></div>
        <SpaceNav onNavigate={() => setMobileNavOpen(false)} />
      </aside>
    </div>}
  </div>

  async function signOut() {
    await fetch('/api/account-session/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => undefined)
    window.location.replace('/sign-in')
  }
}

function SpaceNav({ onNavigate }: { onNavigate?: () => void }) {
  return <nav className="sticky top-16 max-h-[calc(100vh-64px)] overflow-y-auto px-3 py-5" aria-label="Otya Space">
    <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-[.16em] otya-muted">Workspace</div>
    <div className="space-y-0.5">
      {MAIN_NAV.map(([label, href, icon]) => <Link key={label} href={href} onClick={onNavigate} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-white/5"><span className="w-5 text-center text-sm opacity-70 group-hover:opacity-100">{icon}</span><span>{label}</span></Link>)}
    </div>
    <div className="my-4 border-t" style={{ borderColor: 'var(--cosmos-divider)' }} />
    <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-[.16em] otya-muted">Console</div>
    <Link href="/admin" onClick={onNavigate} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-white/5"><span className="w-5 text-center">⌘</span><span>Admin</span></Link>
    <div className="mt-4 space-y-0.5">
      <Link href="/help" onClick={onNavigate} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm otya-muted hover:bg-white/5"><span className="w-5 text-center">?</span><span>Help & support</span></Link>
    </div>
  </nav>
}

function MenuLink({ href, children, onClick }: { href: string; children: ReactNode; onClick?: () => void }) {
  return <Link href={href} onClick={onClick} className="block rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-white/5">{children}</Link>
}
