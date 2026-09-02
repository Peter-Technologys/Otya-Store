'use client'

import { useEffect, useState } from 'react'
import {
  SpaceButton,
  SpaceCard,
  SpaceEmpty,
  SpaceLoading,
  SpaceMessage,
  SpacePage,
  SpaceReadOnly,
} from '@/components/SpaceSectionUi'

type User = { email?: string | null; is_verified?: boolean | number }
type TwoFactor = { enabled?: boolean; available?: boolean; recovery_codes_remaining?: number }
type Setup = { secret: string; otpauth_uri: string }
type Json = Record<string, unknown>

async function accountFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  return fetch(`/api/account-session/${path}`, { ...init, headers, credentials: 'same-origin', cache: 'no-store' })
}

export default function SecurityPage() {
  const [user, setUser] = useState<User | null>(null)
  const [twoFactor, setTwoFactor] = useState<TwoFactor | null>(null)
  const [setup, setSetup] = useState<Setup | null>(null)
  const [emailCode, setEmailCode] = useState('')
  const [totp, setTotp] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [accountResponse, twoFactorResponse] = await Promise.all([
        accountFetch('account'),
        accountFetch('2fa/status').catch(() => null),
      ])
      const account = await accountResponse.json().catch(() => ({})) as { user?: User; error?: string }
      if (!accountResponse.ok || !account.user) throw new Error(account.error || 'Could not load account security.')
      setUser(account.user)
      if (twoFactorResponse?.ok) setTwoFactor(await twoFactorResponse.json().catch(() => ({})) as TwoFactor)
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function action(task: () => Promise<string>) {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try { setNotice(await task()) } catch (cause) { setError((cause as Error).message) } finally { setBusy(false) }
  }

  async function sendEmailCode() {
    await action(async () => {
      const response = await accountFetch('send-verification', { method: 'POST' })
      const data = await response.json().catch(() => ({})) as { error?: string; message?: string }
      if (!response.ok) throw new Error(data.error || 'Could not send a verification code.')
      return data.message || 'Verification code sent.'
    })
  }

  async function verifyEmail() {
    const code = emailCode.trim().toUpperCase()
    if (!/^[A-Z][0-9]{4}$/.test(code)) return setError('Enter a code like A1234.')
    await action(async () => {
      const response = await accountFetch('verify-email', { method: 'POST', body: JSON.stringify({ otp: code }) })
      const data = await response.json().catch(() => ({})) as { error?: string; message?: string }
      if (!response.ok) throw new Error(data.error || 'Could not verify your email.')
      setEmailCode('')
      setUser(current => current ? { ...current, is_verified: true } : current)
      return data.message || 'Email verified.'
    })
  }

  async function startTwoFactor() {
    await action(async () => {
      const response = await accountFetch('2fa/setup', { method: 'POST' })
      const data = await response.json().catch(() => ({})) as { secret?: string; otpauth_uri?: string; error?: string }
      if (!response.ok || !data.secret || !data.otpauth_uri) throw new Error(data.error || 'Could not start two-step verification setup.')
      setSetup({ secret: data.secret, otpauth_uri: data.otpauth_uri })
      setTotp('')
      setRecoveryCodes([])
      return 'Add Otya to your authenticator app, then enter the current 6-digit code.'
    })
  }

  async function enableTwoFactor() {
    if (totp.length !== 6) return setError('Enter the 6-digit authenticator code.')
    await action(async () => {
      const response = await accountFetch('2fa/enable', { method: 'POST', body: JSON.stringify({ code: totp }) })
      const data = await response.json().catch(() => ({})) as { recovery_codes?: string[]; error?: string; sign_in_again?: boolean }
      if (!response.ok) throw new Error(data.error || 'Could not enable two-step verification.')
      const codes = Array.isArray(data.recovery_codes) ? data.recovery_codes : []
      setRecoveryCodes(codes)
      setSetup(null)
      setTotp('')
      setTwoFactor({ enabled: true, available: true, recovery_codes_remaining: codes.length })
      return 'Two-step verification is on. Save the recovery codes before signing in again.'
    })
  }

  async function disableTwoFactor() {
    if (totp.length !== 6) return setError('Enter the 6-digit authenticator code.')
    await action(async () => {
      const response = await accountFetch('2fa/disable', { method: 'POST', body: JSON.stringify({ code: totp }) })
      const data = await response.json().catch(() => ({})) as { error?: string; sign_in_again?: boolean }
      if (!response.ok) throw new Error(data.error || 'Could not turn off two-step verification.')
      window.location.replace('/sign-in?security=updated')
      return 'Two-step verification is off.'
    })
  }

  async function regenerateRecoveryCodes() {
    if (totp.length !== 6) return setError('Enter the 6-digit authenticator code.')
    await action(async () => {
      const response = await accountFetch('2fa/recovery-codes', { method: 'POST', body: JSON.stringify({ code: totp }) })
      const data = await response.json().catch(() => ({})) as { recovery_codes?: string[]; error?: string }
      if (!response.ok || !Array.isArray(data.recovery_codes)) throw new Error(data.error || 'Could not create new recovery codes.')
      setRecoveryCodes(data.recovery_codes)
      setTotp('')
      return 'New recovery codes created. The previous recovery codes no longer work.'
    })
  }

  if (loading && !user) return <SpaceLoading label="Loading security…" />

  return <SpacePage title="Security" subtitle="Email verification, two-step verification and recovery controls for this Otya account.">
    {error && <SpaceMessage kind="error">{error}</SpaceMessage>}
    {notice && <SpaceMessage>{notice}</SpaceMessage>}

    <div className="space-y-4">
      <SpaceCard title="Primary email" subtitle="Verification proves you control the email attached to this account.">
        {user?.email ? <>
          <div className="grid sm:grid-cols-2 gap-3">
            <SpaceReadOnly label="Email" value={user.email} />
            <SpaceReadOnly label="Status" value={user.is_verified ? 'Verified' : 'Verification required'} />
          </div>
          {!user.is_verified && <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <SpaceButton quiet onClick={() => void sendEmailCode()} disabled={busy}>Send code</SpaceButton>
            <input value={emailCode} onChange={event => setEmailCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))} placeholder="A1234" autoComplete="one-time-code" className="min-h-11 rounded-xl border px-3 bg-transparent outline-none sm:max-w-[170px]" style={{ borderColor: 'var(--cosmos-divider)' }} />
            <SpaceButton onClick={() => void verifyEmail()} disabled={busy}>Verify email</SpaceButton>
          </div>}
        </> : <SpaceEmpty>This account currently has no primary email. Telegram-first accounts are valid Otya accounts; add an email from Sign-in methods if you want email recovery.</SpaceEmpty>}
      </SpaceCard>

      <SpaceCard title="Two-step verification" subtitle="Use an authenticator app for an additional sign-in check. Sensitive changes revoke existing sessions.">
        <SpaceReadOnly label="Status" value={twoFactor?.enabled ? `On · ${twoFactor.recovery_codes_remaining ?? 0} recovery codes remaining` : twoFactor?.available === false ? 'Unavailable on this deployment' : 'Off'} />

        {twoFactor?.available !== false && !twoFactor?.enabled && !setup && <div className="mt-4"><SpaceButton onClick={() => void startTwoFactor()} disabled={busy}>Set up authenticator</SpaceButton></div>}

        {setup && <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: 'var(--cosmos-divider)' }}>
          <SpaceReadOnly label="Authenticator secret" value={setup.secret} mono />
          <p className="mt-3 text-sm leading-6 otya-muted">Add the secret to your authenticator app under Otya, then enter its current 6-digit code.</p>
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <input value={totp} onChange={event => setTotp(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="123456" className="min-h-11 rounded-xl border px-3 bg-transparent outline-none sm:max-w-[170px]" style={{ borderColor: 'var(--cosmos-divider)' }} />
            <SpaceButton onClick={() => void enableTwoFactor()} disabled={busy || totp.length !== 6}>Enable</SpaceButton>
            <SpaceButton quiet onClick={() => { setSetup(null); setTotp('') }} disabled={busy}>Cancel</SpaceButton>
          </div>
        </div>}

        {twoFactor?.enabled && <div className="mt-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={totp} onChange={event => setTotp(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="Current 6-digit code" className="min-h-11 rounded-xl border px-3 bg-transparent outline-none sm:max-w-[200px]" style={{ borderColor: 'var(--cosmos-divider)' }} />
            <SpaceButton quiet onClick={() => void regenerateRecoveryCodes()} disabled={busy || totp.length !== 6}>New recovery codes</SpaceButton>
            <SpaceButton quiet onClick={() => void disableTwoFactor()} disabled={busy || totp.length !== 6}>Turn off</SpaceButton>
          </div>
        </div>}

        {recoveryCodes.length > 0 && <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-surface)' }}>
          <h3 className="font-black">Save these recovery codes now</h3>
          <p className="mt-1 text-sm otya-muted">Each code works once. Store them somewhere private outside this browser.</p>
          <div className="mt-3 grid sm:grid-cols-2 gap-2">{recoveryCodes.map(code => <div key={code} className="rounded-xl border px-3 py-2 font-mono text-sm font-bold" style={{ borderColor: 'var(--cosmos-divider)' }}>{code}</div>)}</div>
          <div className="mt-4"><SpaceButton onClick={() => window.location.replace('/sign-in?security=updated')}>I saved them · Sign in again</SpaceButton></div>
        </div>}
      </SpaceCard>
    </div>
  </SpacePage>
}
