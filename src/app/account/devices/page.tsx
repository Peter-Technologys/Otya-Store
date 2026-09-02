'use client'

import { useEffect, useState } from 'react'
import {
  SpaceButton,
  SpaceCard,
  SpaceEmpty,
  SpaceLoading,
  SpaceMessage,
  SpacePage,
} from '@/components/SpaceSectionUi'

type Session = { id: string; created_at?: string; last_used_at?: string; ip?: string | null; user_agent?: string | null }

async function accountFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  return fetch(`/api/account-session/${path}`, { ...init, headers, credentials: 'same-origin', cache: 'no-store' })
}

export default function DevicesPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => { void loadSessions() }, [])

  async function loadSessions() {
    setLoading(true)
    try {
      const response = await accountFetch('sessions')
      const data = await response.json().catch(() => ({})) as { sessions?: Session[]; error?: string }
      if (!response.ok) throw new Error(data.error || 'Could not load Otya sessions.')
      setSessions(Array.isArray(data.sessions) ? data.sessions : [])
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function revoke(id: string) {
    if (busyId) return
    setBusyId(id); setError(''); setNotice('')
    try {
      const response = await accountFetch('sessions', { method: 'DELETE', body: JSON.stringify({ session_id: id }) })
      const data = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) throw new Error(data.error || 'Could not sign out that session.')
      setSessions(current => current.filter(session => session.id !== id))
      setNotice('Session signed out.')
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  async function revokeAll() {
    if (busyId) return
    setBusyId('all'); setError(''); setNotice('')
    try {
      const response = await accountFetch('sessions/revoke-all', { method: 'POST' })
      const data = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) throw new Error(data.error || 'Could not revoke all sessions.')
      window.location.replace('/sign-in?security=sessions-revoked')
    } catch (cause) {
      setError((cause as Error).message)
      setBusyId(null)
    }
  }

  if (loading) return <SpaceLoading label="Loading devices and sessions…" />

  return <SpacePage title="Devices & sessions" subtitle="Review recorded Otya sign-ins and remove access you no longer trust.">
    {error && <SpaceMessage kind="error">{error}</SpaceMessage>}
    {notice && <SpaceMessage>{notice}</SpaceMessage>}

    <SpaceCard title="Active sessions" subtitle="A session represents a signed-in Otya browser or app session recorded by the authentication service." action={sessions.length ? <SpaceButton quiet onClick={() => void revokeAll()} disabled={Boolean(busyId)}>Sign out all</SpaceButton> : undefined}>
      {sessions.length === 0 ? <SpaceEmpty>No recorded active sessions.</SpaceEmpty> : <div className="space-y-3">
        {sessions.map(session => <article key={session.id} className="rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4" style={{ borderColor: 'var(--cosmos-divider)' }}>
          <div className="min-w-0">
            <div className="font-black break-words">{describeAgent(session.user_agent)}</div>
            <div className="mt-1 text-xs leading-5 otya-muted">Last used {formatDate(session.last_used_at)}{session.ip ? ` · ${session.ip}` : ''}</div>
            {session.created_at && <div className="mt-1 text-xs otya-muted">Created {formatDate(session.created_at)}</div>}
          </div>
          <SpaceButton quiet onClick={() => void revoke(session.id)} disabled={Boolean(busyId)}>{busyId === session.id ? 'Signing out…' : 'Sign out'}</SpaceButton>
        </article>)}
      </div>}
    </SpaceCard>
  </SpacePage>
}

function describeAgent(value?: string | null) {
  const agent = value?.trim() || ''
  if (!agent) return 'Otya session'
  if (/android/i.test(agent)) return 'Android · Otya'
  if (/chrome/i.test(agent)) return 'Chrome browser'
  if (/safari/i.test(agent)) return 'Safari browser'
  if (/firefox/i.test(agent)) return 'Firefox browser'
  return agent.length > 90 ? `${agent.slice(0, 87)}…` : agent
}

function formatDate(value?: string) {
  if (!value) return 'time not recorded'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'recently'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}
