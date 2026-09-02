'use client'

import { useEffect, useState } from 'react'

const API = '/api/account-session'
type Session = { id: string; created_at: string; last_used_at: string; ip?: string | null; user_agent?: string | null }

async function accountFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  return fetch(`${API}/${path}`, { ...init, headers, credentials: 'same-origin', cache: 'no-store' })
}

export default function DevicesPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    try {
      const response = await accountFetch('sessions')
      const data = await response.json().catch(() => ({})) as { sessions?: Session[]; error?: string }
      if (!response.ok) throw new Error(data.error || 'Could not load devices and sessions.')
      setSessions(Array.isArray(data.sessions) ? data.sessions : [])
    } catch (cause) { setError((cause as Error).message) }
    finally { setLoading(false) }
  }

  async function revoke(id: string) {
    if (busy) return
    setBusy(id); setError(''); setNotice('')
    try {
      const response = await accountFetch('sessions', { method: 'DELETE', body: JSON.stringify({ session_id: id }) })
      const data = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) throw new Error(data.error || 'Could not sign out that session.')
      setNotice('Session signed out.')
      await load()
    } catch (cause) { setError((cause as Error).message) }
    finally { setBusy('') }
  }

  async function revokeAll() {
    if (busy) return
    setBusy('all'); setError(''); setNotice('')
    try {
      const response = await accountFetch('sessions/revoke-all', { method: 'POST' })
      const data = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) throw new Error(data.error || 'Could not sign out all sessions.')
      setNotice('All recorded sessions were signed out.')
      await load()
    } catch (cause) { setError((cause as Error).message) }
    finally { setBusy('') }
  }

  return <main className="px-4 sm:px-7 lg:px-10 py-7 sm:py-9 max-w-[980px]">
    <header className="mb-7"><div className="text-[11px] font-black uppercase tracking-[.16em] otya-muted">Otya Space</div><h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-[-.045em]">Devices & sessions</h1><p className="mt-2 text-sm sm:text-base otya-muted">Review where this Otya account has been used and remove sessions you no longer trust.</p></header>
    {error && <div className="mb-5 rounded-2xl border border-red-500/25 px-4 py-3 text-sm text-red-700 dark:text-red-200">{error}</div>}
    {notice && <div className="mb-5 rounded-2xl border border-emerald-500/25 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200">{notice}</div>}
    <div className="mb-4 flex items-center justify-between gap-3"><div className="text-sm font-black">{loading ? 'Loading…' : `${sessions.length} recorded session${sessions.length === 1 ? '' : 's'}`}</div><button disabled={loading || sessions.length === 0 || Boolean(busy)} onClick={() => void revokeAll()} className="otya-quiet-button min-h-10 rounded-xl px-3.5 text-xs font-black disabled:opacity-50">Sign out all</button></div>
    <section className="grid gap-3">
      {!loading && sessions.length === 0 && <div className="rounded-[22px] border p-6 text-sm otya-muted" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-card)' }}>No recorded sessions need review.</div>}
      {sessions.map(session => <article key={session.id} className="rounded-[22px] border p-5" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-card)' }}><div className="flex flex-col sm:flex-row sm:items-start gap-4"><div className="min-w-0 flex-1"><div className="font-black break-words">{deviceLabel(session.user_agent)}</div><div className="mt-1 text-xs otya-muted break-all">{session.ip || 'Network address unavailable'}</div><dl className="mt-4 grid sm:grid-cols-2 gap-3 text-xs"><Meta label="Created" value={formatDate(session.created_at)} /><Meta label="Last used" value={formatDate(session.last_used_at)} /></dl></div><button disabled={Boolean(busy)} onClick={() => void revoke(session.id)} className="otya-quiet-button min-h-10 rounded-xl px-3.5 text-xs font-black disabled:opacity-50">{busy === session.id ? 'Signing out…' : 'Sign out'}</button></div></article>)}
    </section>
  </main>
}

function Meta({ label, value }: { label: string; value: string }) { return <div><dt className="font-black otya-muted">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div> }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Unknown' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date) }
function deviceLabel(userAgent?: string | null) { if (!userAgent) return 'Otya session'; if (/Android/i.test(userAgent)) return 'Android device'; if (/iPhone|iPad/i.test(userAgent)) return 'Apple device'; if (/Windows/i.test(userAgent)) return 'Windows browser'; if (/Macintosh/i.test(userAgent)) return 'Mac browser'; return userAgent.slice(0, 90) }
