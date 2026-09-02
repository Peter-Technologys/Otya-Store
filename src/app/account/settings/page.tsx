'use client'

import { useEffect, useState } from 'react'
import {
  SpaceButton,
  SpaceCard,
  SpaceField,
  SpaceLoading,
  SpaceMessage,
  SpacePage,
  SpaceReadOnly,
} from '@/components/SpaceSectionUi'

type User = {
  country_code?: string | null
  locale?: string | null
  timezone?: string | null
}
type Consent = {
  terms_accepted?: number | boolean
  terms_version?: string | null
  privacy_accepted?: number | boolean
  privacy_version?: string | null
}

async function accountFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  return fetch(`/api/account-session/${path}`, { ...init, headers, credentials: 'same-origin', cache: 'no-store' })
}

export default function SettingsPage() {
  const [country, setCountry] = useState('')
  const [locale, setLocale] = useState('')
  const [timezone, setTimezone] = useState('')
  const [consent, setConsent] = useState<Consent | null>(null)
  const [deleteText, setDeleteText] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [accountResponse, consentResponse] = await Promise.all([
        accountFetch('account'),
        accountFetch('consent').catch(() => null),
      ])
      const account = await accountResponse.json().catch(() => ({})) as { user?: User; error?: string }
      if (!accountResponse.ok || !account.user) throw new Error(account.error || 'Could not load preferences.')
      const localLocale = typeof navigator !== 'undefined' ? navigator.language : ''
      const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
      setCountry(account.user.country_code || '')
      setLocale(account.user.locale || localLocale)
      setTimezone(account.user.timezone || localTimezone)
      if (consentResponse?.ok) {
        const data = await consentResponse.json().catch(() => ({})) as { consent?: Consent }
        setConsent(data.consent ?? null)
      }
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function save() {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      const response = await accountFetch('account', {
        method: 'PATCH',
        body: JSON.stringify({
          country_code: country.trim() || null,
          locale: locale.trim() || null,
          timezone: timezone.trim() || null,
        }),
      })
      const data = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) throw new Error(data.error || 'Could not save preferences.')
      setNotice('Preferences saved.')
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function deleteAccount() {
    if (deleteText !== 'DELETE' || busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      const response = await accountFetch('delete-account', { method: 'POST' })
      const data = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) throw new Error(data.error || 'Could not delete your Otya account.')
      window.location.replace('/sign-in?account=deleted')
    } catch (cause) {
      setError((cause as Error).message)
      setBusy(false)
    }
  }

  if (loading) return <SpaceLoading label="Loading preferences…" />

  return <SpacePage title="Preferences" subtitle="Regional account preferences and privacy records for Otya Space.">
    {error && <SpaceMessage kind="error">{error}</SpaceMessage>}
    {notice && <SpaceMessage>{notice}</SpaceMessage>}

    <div className="space-y-4">
      <SpaceCard title="Region & language" subtitle="These preferences help Otya present account information correctly; they do not change media stored on your device.">
        <div className="grid sm:grid-cols-3 gap-3">
          <SpaceField label="Country / region" value={country} onChange={setCountry} placeholder="UG" />
          <SpaceField label="Language" value={locale} onChange={setLocale} placeholder="en-UG" />
          <SpaceField label="Timezone" value={timezone} onChange={setTimezone} placeholder="Africa/Kampala" />
        </div>
        <div className="mt-4"><SpaceButton onClick={() => void save()} disabled={busy}>{busy ? 'Saving…' : 'Save preferences'}</SpaceButton></div>
      </SpaceCard>

      <SpaceCard title="Terms & privacy" subtitle="Acceptance records belong to the account; changing optional marketing communication is handled under Notifications.">
        <div className="grid sm:grid-cols-2 gap-3">
          <SpaceReadOnly label="Terms" value={consent?.terms_accepted ? `Accepted${consent.terms_version ? ` · ${consent.terms_version}` : ''}` : 'Not recorded'} />
          <SpaceReadOnly label="Privacy Policy" value={consent?.privacy_accepted ? `Accepted${consent.privacy_version ? ` · ${consent.privacy_version}` : ''}` : 'Not recorded'} />
        </div>
      </SpaceCard>

      <SpaceCard title="Delete Otya account" subtitle="This permanently removes the authentication account after revoking its sessions. Product-data cleanup is requested from the Otya backend as part of the deletion flow.">
        <p className="text-sm leading-6 otya-muted">This is destructive. Type <strong className="text-[color:var(--cosmos-text-primary)]">DELETE</strong> only when you intend to remove the account.</p>
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <input value={deleteText} onChange={event => setDeleteText(event.target.value.toUpperCase().slice(0, 6))} placeholder="DELETE" className="min-h-11 rounded-xl border px-3 bg-transparent outline-none sm:max-w-[180px]" style={{ borderColor: 'var(--cosmos-divider)' }} />
          <SpaceButton quiet onClick={() => void deleteAccount()} disabled={busy || deleteText !== 'DELETE'}>{busy ? 'Working…' : 'Delete account'}</SpaceButton>
        </div>
      </SpaceCard>
    </div>
  </SpacePage>
}
