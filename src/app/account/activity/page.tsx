'use client'

import { useEffect, useState } from 'react'
import {
  SpaceCard,
  SpaceEmpty,
  SpaceLoading,
  SpaceMessage,
  SpacePage,
} from '@/components/SpaceSectionUi'

type Session = { id: string; created_at?: string; last_used_at?: string; ip?: string | null; user_agent?: string | null }

export default function ActivityPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    void fetch('/api/account-session/sessions', {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    }).then(async response => {
      const data = await response.json().catch(() => ({})) as { sessions?: Session[]; error?: string }
      if (!response.ok) throw new Error(data.error || 'Could not load account activity.')
      if (!cancelled) setSessions(Array.isArray(data.sessions) ? data.sessions : [])
    }).catch(cause => {
      if (!cancelled) setError((cause as Error).message)
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  if (loading) return <SpaceLoading label="Loading account activity…" />

  const ordered = [...sessions].sort((a, b) => dateValue(b.last_used_at) - dateValue(a.last_used_at))

  return <SpacePage title="Activity" subtitle="A privacy-conscious view of recorded account sign-in activity. Otya does not invent events that the backend has not recorded.">
    {error && <SpaceMessage kind="error">{error}</SpaceMessage>}
    <SpaceCard title="Recent sign-ins" subtitle="Use Devices & sessions to revoke access. This page is read-only so the activity record is not mixed with controls.">
      {ordered.length === 0 ? <SpaceEmpty>No recorded account activity yet.</SpaceEmpty> : <div className="relative pl-5">
        <div className="absolute left-[6px] top-2 bottom-2 w-px" style={{ background: 'var(--cosmos-divider)' }} />
        <div className="space-y-5">{ordered.map(session => <article key={session.id} className="relative">
          <span className="absolute -left-5 top-1.5 h-3 w-3 rounded-full border-2" style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-primary)' }} />
          <div className="font-black text-sm">{describeAgent(session.user_agent)}</div>
          <div className="mt-1 text-xs leading-5 otya-muted">Last used {formatDate(session.last_used_at)}{session.ip ? ` · ${session.ip}` : ''}</div>
          {session.created_at && <div className="text-xs otya-muted">Session created {formatDate(session.created_at)}</div>}
        </article>)}</div>
      </div>}
    </SpaceCard>
  </SpacePage>
}

function dateValue(value?: string) {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0
}

function describeAgent(value?: string | null) {
  const agent = value?.trim() || ''
  if (!agent) return 'Otya sign-in'
  if (/android/i.test(agent)) return 'Android · Otya'
  if (/chrome/i.test(agent)) return 'Chrome browser'
  if (/safari/i.test(agent)) return 'Safari browser'
  if (/firefox/i.test(agent)) return 'Firefox browser'
  return 'Otya browser session'
}

function formatDate(value?: string) {
  if (!value) return 'time not recorded'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'recently'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}
