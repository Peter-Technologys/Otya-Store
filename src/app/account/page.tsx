'use client'

import Link from 'next/link'
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
  id?: string
  otya_id?: string | null
  email?: string | null
  name?: string | null
  avatar_url?: string | null
  is_verified?: boolean | number
  phone_number?: string | null
  phone_verified_at?: string | null
  recovery_email?: string | null
}

type Identity = { provider: string; provider_username?: string | null }
type Json = { user?: User; identities?: Identity[]; error?: string }

async function accountFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  return fetch(`/api/account-session/${path}`, { ...init, headers, credentials: 'same-origin', cache: 'no-store' })
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null)
  const [identities, setIdentities] = useState<Identity[]>([])
  const [name, setName] = useState('')
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => { void loadAccount() }, [])

  async function loadAccount() {
    setLoading(true)
    setError('')
    try {
      const response = await accountFetch('account')
      const data = await response.json().catch(() => ({})) as Json
      if (!response.ok || !data.user) throw new Error(data.error || 'Could not load your Otya account.')
      setUser(data.user)
      setIdentities(Array.isArray(data.identities) ? data.identities : [])
      setName(data.user.name || '')
      setRecoveryEmail(data.user.recovery_email || '')
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function saveProfile() {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      const response = await accountFetch('account', {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim() || null,
          recovery_email: recoveryEmail.trim() || null,
        }),
      })
      const data = await response.json().catch(() => ({})) as Json
      if (!response.ok) throw new Error(data.error || 'Could not save your account.')
      if (data.user) setUser(data.user)
      setNotice('Account details saved.')
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (loading && !user) return <SpaceLoading label="Loading account…" />

  return <SpacePage title="Account overview" subtitle="Your Otya identity and personal account details. Security, devices, providers and preferences each have their own Space page.">
    {error && <SpaceMessage kind="error">{error}</SpaceMessage>}
    {notice && <SpaceMessage>{notice}</SpaceMessage>}

    {user && <div className="space-y-4">
      <SpaceCard title="Otya identity" subtitle="Your public Otya ID stays stable across the app, Space and connected sign-in methods.">
        <div className="grid sm:grid-cols-2 gap-3">
          <SpaceReadOnly label="Otya ID" value={user.otya_id || 'Being assigned'} mono />
          <SpaceReadOnly label="Primary email" value={user.email || 'No primary email added'} />
          <SpaceReadOnly label="Email status" value={!user.email ? 'Not applicable' : user.is_verified ? 'Verified' : 'Verification required'} />
          <SpaceReadOnly label="Phone" value={user.phone_number ? `${user.phone_number}${user.phone_verified_at ? ' · verified' : ''}` : 'Not added'} />
        </div>
        {user.email && !user.is_verified && <p className="mt-4 text-sm otya-muted">Email verification is unfinished. <Link href="/account/security/" className="font-black text-[color:var(--cosmos-text-primary)]">Open Security</Link> to request or enter a code.</p>}
      </SpaceCard>

      <SpaceCard title="Profile" subtitle="Information shown inside your Otya account. These fields do not change your public Otya ID.">
        <div className="grid sm:grid-cols-2 gap-3">
          <SpaceField label="Name" value={name} onChange={setName} autoComplete="name" />
          <SpaceField label="Recovery email" value={recoveryEmail} onChange={setRecoveryEmail} type="email" autoComplete="email" placeholder="Optional" />
        </div>
        <div className="mt-4"><SpaceButton onClick={() => void saveProfile()} disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</SpaceButton></div>
      </SpaceCard>

      <SpaceCard title="Connected access" subtitle="Email, Google and Telegram can belong to this same Otya account; they are not separate user accounts.">
        <div className="flex flex-wrap gap-2 text-xs font-black">
          <Method label="Email" on={Boolean(user.email)} />
          <Method label="Google" on={identities.some(identity => identity.provider === 'google')} />
          <Method label="Telegram" on={identities.some(identity => identity.provider === 'telegram')} />
        </div>
        <Link href="/account/sign-in-methods/" className="mt-4 inline-flex min-h-11 items-center text-sm font-black">Manage sign-in methods →</Link>
      </SpaceCard>
    </div>}
  </SpacePage>
}

function Method({ label, on }: { label: string; on: boolean }) {
  return <span className="rounded-full border px-3 py-1.5" style={{ borderColor: 'var(--cosmos-divider)', opacity: on ? 1 : .5 }}>{label} · {on ? 'connected' : 'not set'}</span>
}
