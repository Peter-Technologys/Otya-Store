'use client'

import { useEffect, useState } from 'react'
import {
  SpaceButton,
  SpaceCard,
  SpaceLoading,
  SpaceMessage,
  SpacePage,
  SpaceReadOnly,
} from '@/components/SpaceSectionUi'

type Consent = { marketing_consent?: number | boolean; marketing_updated_at?: string | null }

async function accountFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  return fetch(`/api/account-session/${path}`, { ...init, headers, credentials: 'same-origin', cache: 'no-store' })
}

export default function NotificationsPage() {
  const [consent, setConsent] = useState<Consent | null>(null)
  const [marketing, setMarketing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    try {
      const response = await accountFetch('consent')
      const data = await response.json().catch(() => ({})) as { consent?: Consent; error?: string }
      if (!response.ok) throw new Error(data.error || 'Could not load notification preferences.')
      const value = data.consent ?? {}
      setConsent(value)
      setMarketing(value.marketing_consent === true || value.marketing_consent === 1)
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function saveMarketing() {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      const response = await accountFetch('consent', {
        method: 'PATCH',
        body: JSON.stringify({ marketing_consent: marketing }),
      })
      const data = await response.json().catch(() => ({})) as { consent?: Consent; error?: string }
      if (!response.ok) throw new Error(data.error || 'Could not update notification preferences.')
      if (data.consent) setConsent(data.consent)
      setNotice(marketing ? 'Optional Otya product news is on.' : 'Optional Otya product news is off.')
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <SpaceLoading label="Loading notification preferences…" />

  return <SpacePage title="Notifications" subtitle="Control optional Otya product communication separately from necessary security and account messages.">
    {error && <SpaceMessage kind="error">{error}</SpaceMessage>}
    {notice && <SpaceMessage>{notice}</SpaceMessage>}

    <div className="space-y-4">
      <SpaceCard title="Security & account messages" subtitle="These messages protect or operate your account and are not treated as marketing.">
        <div className="grid sm:grid-cols-2 gap-3">
          <SpaceReadOnly label="Verification and recovery codes" value="Sent when requested" />
          <SpaceReadOnly label="Security alerts" value="Sent when relevant" />
        </div>
        <p className="mt-4 text-sm leading-6 otya-muted">Turning off product news does not suppress password-reset codes, email-verification codes or important security notices.</p>
      </SpaceCard>

      <SpaceCard title="Optional product news" subtitle="Choose whether PeterSmart Link may send non-essential Otya product updates to your account email.">
        <label className="flex min-h-12 items-center gap-3 rounded-2xl border px-4" style={{ borderColor: 'var(--cosmos-divider)' }}>
          <input type="checkbox" checked={marketing} onChange={event => setMarketing(event.target.checked)} className="h-5 w-5 accent-violet-500" />
          <span className="text-sm font-bold">Send me optional Otya product news</span>
        </label>
        <div className="mt-4"><SpaceButton onClick={() => void saveMarketing()} disabled={busy}>{busy ? 'Saving…' : 'Save preference'}</SpaceButton></div>
        {consent?.marketing_updated_at && <div className="mt-3 text-xs otya-muted">Last updated {formatDate(consent.marketing_updated_at)}</div>}
      </SpaceCard>
    </div>
  </SpacePage>
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'recently'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}
