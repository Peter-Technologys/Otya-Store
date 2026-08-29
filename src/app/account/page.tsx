'use client'

import { FormEvent, ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'

import { SiteFooter } from '@/components/SiteFooter'
import { SiteNav } from '@/components/SiteNav'

const TERMS_VERSION = '2026-08-28'
const PRIVACY_VERSION = '2026-08-28'
const API = '/api/account-session'

type User = {
  id: string
  email: string
  name?: string | null
  avatar_url?: string | null
  is_verified?: boolean | number
  phone_number?: string | null
  phone_verified_at?: string | null
  recovery_email?: string | null
  country_code?: string | null
  locale?: string | null
  timezone?: string | null
}

type Identity = { provider: string; provider_username?: string | null }
type Session = {
  id: string
  created_at: string
  last_used_at: string
  ip?: string | null
  user_agent?: string | null
}
type TwoFactorStatus = {
  enabled: boolean
  recovery_codes_remaining: number
  available: boolean
}
type TwoFactorSetup = { secret: string; otpauth_uri: string }
type Consent = {
  terms_accepted?: number
  privacy_accepted?: number
  marketing_consent?: number
}
type Json = Record<string, any>

async function accountFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  return fetch(`${API}/${path}`, {
    ...init,
    headers,
    cache: 'no-store',
    credentials: 'same-origin',
  })
}

export default function AccountPage() {
  const [checkingSession, setCheckingSession] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [identities, setIdentities] = useState<Identity[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [twoFactor, setTwoFactor] = useState<TwoFactorStatus | null>(null)
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [consent, setConsent] = useState<Consent | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [registering, setRegistering] = useState(false)
  const [terms, setTerms] = useState(false)
  const [privacy, setPrivacy] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [challenge, setChallenge] = useState(false)
  const [useRecovery, setUseRecovery] = useState(false)
  const [secondFactor, setSecondFactor] = useState('')

  const [editName, setEditName] = useState('')
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [country, setCountry] = useState('')
  const [locale, setLocale] = useState('')
  const [timezone, setTimezone] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneCode, setPhoneCode] = useState('')
  const [phoneCodeSent, setPhoneCodeSent] = useState(false)
  const [emailCode, setEmailCode] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [disableCode, setDisableCode] = useState('')

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    setLocale(navigator.language || '')
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || '')
    void restoreSession()
  }, [])

  async function restoreSession() {
    setCheckingSession(true)
    try {
      const response = await accountFetch('session')
      const data = await response.json().catch(() => ({})) as Json
      if (!response.ok || data.authenticated !== true) {
        setAuthenticated(false)
        setUser(null)
        return
      }
      setAuthenticated(true)
      hydrateAccount(data)
      await refreshSecondary()
    } catch {
      setAuthenticated(false)
    } finally {
      setCheckingSession(false)
    }
  }

  function hydrateAccount(data: Json) {
    const nextUser = data.user as User | undefined
    if (!nextUser) return
    setUser(nextUser)
    setIdentities(Array.isArray(data.identities) ? data.identities : [])
    setEditName(nextUser.name || '')
    setRecoveryEmail(nextUser.recovery_email || '')
    setCountry(nextUser.country_code || '')
    setLocale(nextUser.locale || navigator.language || '')
    setTimezone(nextUser.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || '')
    setPhone(nextUser.phone_number || '')
  }

  async function refreshSecondary() {
    await Promise.all([loadTwoFactor(), loadSessions(), loadConsent()])
  }

  async function loadAccount() {
    const response = await accountFetch('account')
    const data = await response.json().catch(() => ({})) as Json
    if (response.status === 401) {
      setAuthenticated(false)
      setUser(null)
      return
    }
    if (!response.ok) throw new Error(data.error || 'Could not load your OTYA account.')
    hydrateAccount(data)
  }

  async function loadTwoFactor() {
    try {
      const response = await accountFetch('2fa/status')
      const data = await response.json().catch(() => ({})) as Json
      if (response.ok) setTwoFactor(data as unknown as TwoFactorStatus)
    } catch {}
  }

  async function loadSessions() {
    try {
      const response = await accountFetch('sessions')
      const data = await response.json().catch(() => ({})) as Json
      if (response.ok) setSessions(Array.isArray(data.sessions) ? data.sessions : [])
    } catch {}
  }

  async function loadConsent() {
    try {
      const response = await accountFetch('consent')
      const data = await response.json().catch(() => ({})) as Json
      if (response.ok) setConsent((data.consent || null) as Consent | null)
    } catch {}
  }

  async function submitAuth(event: FormEvent) {
    event.preventDefault()
    if (!email.trim() || !password) return
    if (registering && (!terms || !privacy)) {
      setError('Accept the OTYA Terms and Privacy Policy to create your account.')
      return
    }
    if (challenge && !secondFactor.trim()) {
      setError(useRecovery ? 'Enter a recovery code.' : 'Enter your authenticator code.')
      return
    }

    setBusy(true)
    setError('')
    setNotice('')
    try {
      const endpoint = registering ? 'register' : 'login'
      const payload = registering
        ? {
            email: email.trim(),
            password,
            name: name.trim() || undefined,
            terms_accepted: true,
            terms_version: TERMS_VERSION,
            privacy_accepted: true,
            privacy_version: PRIVACY_VERSION,
            marketing_consent: marketing,
          }
        : {
            email: email.trim(),
            password,
            ...(challenge && !useRecovery ? { totp_code: secondFactor.trim() } : {}),
            ...(challenge && useRecovery ? { recovery_code: secondFactor.trim() } : {}),
          }
      const response = await accountFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => ({})) as Json
      if (!response.ok) {
        if (data.code === 'TWO_FACTOR_REQUIRED' || data.code === 'TWO_FACTOR_INVALID') {
          setChallenge(true)
          setSecondFactor('')
          throw new Error(data.error || 'Two-step verification is required.')
        }
        throw new Error(data.error || (registering ? 'Account creation failed.' : 'Sign in failed.'))
      }

      setPassword('')
      setChallenge(false)
      setSecondFactor('')
      setAuthenticated(true)
      hydrateAccount(data)
      await loadAccount()
      await refreshSecondary()
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function signOut() {
    setBusy(true)
    try {
      await accountFetch('logout', { method: 'POST' })
    } catch {}
    setAuthenticated(false)
    setUser(null)
    setSessions([])
    setTwoFactor(null)
    setConsent(null)
    setBusy(false)
  }

  async function saveProfile() {
    await runAction(async () => {
      const response = await accountFetch('account', {
        method: 'PATCH',
        body: JSON.stringify({
          name: editName.trim() || null,
          recovery_email: recoveryEmail.trim() || null,
          country_code: country.trim() || null,
          locale: locale.trim() || null,
          timezone: timezone.trim() || null,
        }),
      })
      const data = await response.json().catch(() => ({})) as Json
      if (!response.ok) throw new Error(data.error || 'Could not save personal info.')
      await loadAccount()
      return 'Personal info saved.'
    })
  }

  async function sendEmailVerification() {
    await runAction(async () => {
      const response = await accountFetch('send-verification', { method: 'POST' })
      const data = await response.json().catch(() => ({})) as Json
      if (!response.ok) throw new Error(data.error || 'Could not send an email verification code.')
      return 'Email verification code sent.'
    })
  }

  async function verifyEmail() {
    if (!emailCode.trim()) return
    await runAction(async () => {
      const response = await accountFetch('verify-email', {
        method: 'POST',
        body: JSON.stringify({ otp: emailCode.trim() }),
      })
      const data = await response.json().catch(() => ({})) as Json
      if (!response.ok) throw new Error(data.error || 'Could not verify email.')
      setEmailCode('')
      await loadAccount()
      return 'Email verified.'
    })
  }

  async function connectTelegram() {
    await runAction(async () => {
      const response = await accountFetch('telegram/start', { method: 'POST' })
      const data = await response.json().catch(() => ({})) as Json
      if (!response.ok || typeof data.authorization_url !== 'string') {
        throw new Error(data.error || 'Telegram linking is unavailable.')
      }
      window.location.assign(data.authorization_url)
      return ''
    })
  }

  async function requestPhoneCode() {
    if (!phone.trim()) return
    await runAction(async () => {
      const response = await accountFetch('phone/request', {
        method: 'POST',
        body: JSON.stringify({ phone_number: phone.trim() }),
      })
      const data = await response.json().catch(() => ({})) as Json
      if (!response.ok) throw new Error(data.error || 'Could not send a verification code.')
      setPhoneCodeSent(true)
      return data.message || 'Verification code sent.'
    })
  }

  async function verifyPhoneCode() {
    if (!phoneCode.trim()) return
    await runAction(async () => {
      const response = await accountFetch('phone/verify', {
        method: 'POST',
        body: JSON.stringify({ code: phoneCode.trim() }),
      })
      const data = await response.json().catch(() => ({})) as Json
      if (!response.ok) throw new Error(data.error || 'Could not verify phone.')
      setPhoneCode('')
      setPhoneCodeSent(false)
      await loadAccount()
      return 'Phone number verified.'
    })
  }

  async function startTwoFactorSetup() {
    await runAction(async () => {
      setRecoveryCodes([])
      const response = await accountFetch('2fa/setup', { method: 'POST' })
      const data = await response.json().catch(() => ({})) as Json
      if (!response.ok) throw new Error(data.error || 'Could not start two-step verification setup.')
      setSetup(data as unknown as TwoFactorSetup)
      return 'Add the secret to your authenticator, then enter its current code.'
    })
  }

  async function enableTwoFactor() {
    if (!totpCode.trim()) return
    await runAction(async () => {
      const response = await accountFetch('2fa/enable', {
        method: 'POST',
        body: JSON.stringify({ code: totpCode.trim() }),
      })
      const data = await response.json().catch(() => ({})) as Json
      if (!response.ok) throw new Error(data.error || 'Could not enable two-step verification.')
      setRecoveryCodes(Array.isArray(data.recovery_codes) ? data.recovery_codes : [])
      setSetup(null)
      setTotpCode('')
      await loadTwoFactor()
      return 'Two-step verification is enabled. Save your recovery codes now.'
    })
  }

  async function disableTwoFactor() {
    if (!disableCode.trim()) return
    await runAction(async () => {
      const digits = disableCode.replace(/\D/g, '')
      const response = await accountFetch('2fa/disable', {
        method: 'POST',
        body: JSON.stringify(
          digits.length === 6
            ? { code: disableCode.trim() }
            : { recovery_code: disableCode.trim() },
        ),
      })
      const data = await response.json().catch(() => ({})) as Json
      if (!response.ok) throw new Error(data.error || 'Could not disable two-step verification.')
      setDisableCode('')
      setRecoveryCodes([])
      await loadTwoFactor()
      return 'Two-step verification disabled.'
    })
  }

  async function regenerateRecoveryCodes() {
    if (!totpCode.trim()) return
    await runAction(async () => {
      const response = await accountFetch('2fa/recovery-codes', {
        method: 'POST',
        body: JSON.stringify({ code: totpCode.trim() }),
      })
      const data = await response.json().catch(() => ({})) as Json
      if (!response.ok) throw new Error(data.error || 'Could not generate new recovery codes.')
      setRecoveryCodes(Array.isArray(data.recovery_codes) ? data.recovery_codes : [])
      setTotpCode('')
      await loadTwoFactor()
      return 'New recovery codes generated. Previous recovery codes no longer work.'
    })
  }

  async function revokeSession(id: string) {
    if (!window.confirm('Sign this session out?')) return
    await runAction(async () => {
      const response = await accountFetch('sessions', {
        method: 'DELETE',
        body: JSON.stringify({ session_id: id }),
      })
      const data = await response.json().catch(() => ({})) as Json
      if (!response.ok) throw new Error(data.error || 'Could not revoke that session.')
      await loadSessions()
      return 'Session signed out.'
    })
  }

  async function revokeAllSessions() {
    if (!window.confirm('Sign out all recorded OTYA sessions?')) return
    await runAction(async () => {
      const response = await accountFetch('sessions/revoke-all', { method: 'POST' })
      const data = await response.json().catch(() => ({})) as Json
      if (!response.ok) throw new Error(data.error || 'Could not revoke sessions.')
      await loadSessions()
      return 'Recorded sessions revoked.'
    })
  }

  async function deleteAccount() {
    if (!window.confirm('Permanently delete your OTYA cloud account? Local media on your devices is not deleted.')) return
    if (!window.confirm('This cannot be undone. Delete the OTYA account permanently?')) return
    await runAction(async () => {
      const response = await accountFetch('delete-account', { method: 'POST' })
      const data = await response.json().catch(() => ({})) as Json
      if (!response.ok) throw new Error(data.error || 'Account deletion was not confirmed.')
      await accountFetch('logout', { method: 'POST' }).catch(() => undefined)
      setAuthenticated(false)
      setUser(null)
      return 'Account deleted.'
    })
  }

  async function runAction(action: () => Promise<string>) {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const message = await action()
      if (message) setNotice(message)
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (checkingSession) {
    return <AccountShell><div className="min-h-[70dvh] grid place-items-center"><div className="text-center"><div className="w-9 h-9 rounded-xl mx-auto mb-3 animate-pulse" style={{ background: 'var(--cosmos-primary)' }} /><p className="text-sm otya-muted">Checking your OTYA session…</p></div></div></AccountShell>
  }

  if (!authenticated || !user) {
    return <AccountShell>
      <main className="min-h-[72dvh] grid place-items-center px-4 py-10">
        <form onSubmit={submitAuth} className="w-full max-w-md modern-card p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-7">
            <img src="/web-app-manifest-192x192.png" alt="OTYA" className="w-12 h-12 rounded-2xl" />
            <div><div className="otya-kicker">OTYA account</div><div className="font-black text-lg">PeterSmart Link</div></div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-[-.04em]">
            {challenge ? 'Confirm it’s you' : registering ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-sm otya-muted mt-3 mb-6">
            {challenge
              ? 'Use your authenticator or a recovery code.'
              : 'An account adds recovery, security, backup and connected features. Local music and video never require sign-in.'}
          </p>
          {error && <Notice tone="error">{error}</Notice>}
          {!challenge && registering && <Input value={name} onChange={setName} placeholder="Name (optional)" autoComplete="name" />}
          <Input value={email} onChange={setEmail} placeholder="Email" type="email" autoComplete="email" disabled={challenge} />
          <Input value={password} onChange={setPassword} placeholder="Password" type="password" autoComplete={registering ? 'new-password' : 'current-password'} disabled={challenge} />
          {challenge && <>
            <Input value={secondFactor} onChange={setSecondFactor} placeholder={useRecovery ? 'Recovery code' : '6-digit authenticator code'} autoFocus />
            <button type="button" onClick={() => { setUseRecovery(value => !value); setSecondFactor(''); setError('') }} className="w-full text-sm font-semibold otya-muted py-2">
              {useRecovery ? 'Use authenticator code' : 'Use a recovery code'}
            </button>
          </>}
          {!challenge && registering && <div className="space-y-3 text-sm my-4">
            <Check checked={terms} onChange={setTerms}>I accept the <Link href="/terms" className="font-semibold">OTYA Terms</Link>.</Check>
            <Check checked={privacy} onChange={setPrivacy}>I accept the <Link href="/privacy" className="font-semibold">Privacy Policy</Link>.</Check>
            <Check checked={marketing} onChange={setMarketing}>Send me optional OTYA product news.</Check>
          </div>}
          <button disabled={busy} className="cosmos-button w-full rounded-xl min-h-12 px-5 mt-2 font-bold disabled:opacity-55">
            {busy ? 'Please wait…' : challenge ? 'Verify and sign in' : registering ? 'Create account' : 'Sign in'}
          </button>
          <button type="button" onClick={() => { challenge ? setChallenge(false) : setRegistering(value => !value); setSecondFactor(''); setError('') }} className="w-full text-sm font-semibold otya-muted py-3 mt-1">
            {challenge ? 'Use another account' : registering ? 'Already have an account? Sign in' : 'New to OTYA? Create an account'}
          </button>
          <div className="flex justify-center gap-5 text-sm mt-3"><Link href="/apps/otya-player/support">Support</Link><Link href="/docs">Docs</Link></div>
          <p className="text-[11px] leading-relaxed text-center otya-muted mt-6">Browser credentials are kept in Secure, HttpOnly cookies and are not exposed to page JavaScript.</p>
        </form>
      </main>
    </AccountShell>
  }

  const telegram = identities.find(identity => identity.provider === 'telegram')
  return <AccountShell>
    <main className="otya-shell py-8 sm:py-12">
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 mb-9">
        <div>
          <div className="otya-kicker">OTYA account</div>
          <h1 className="otya-page-title mt-2">{user.name ? `Hi, ${user.name}` : 'Your account'}</h1>
          <p className="otya-muted mt-2">Identity, security, recovery and connected OTYA services.</p>
        </div>
        <button onClick={() => void signOut()} disabled={busy} className="otya-quiet-button rounded-xl min-h-11 px-4 text-sm font-semibold self-start">Sign out</button>
      </header>

      {(error || notice) && <div className="mb-6"><Notice tone={error ? 'error' : 'success'}>{error || notice}</Notice></div>}

      <div className="grid lg:grid-cols-[210px_minmax(0,1fr)] gap-8">
        <nav className="lg:sticky lg:top-20 lg:self-start flex lg:block gap-2 overflow-x-auto pb-2 lg:pb-0" aria-label="Account sections">
          {[
            ['Overview', '#overview'], ['Personal', '#personal'], ['Security', '#security'], ['Sessions', '#sessions'], ['Connected', '#connected'], ['Privacy', '#privacy'],
          ].map(([label, href]) => <a key={href} href={href} className="block whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold otya-muted hover:opacity-100">{label}</a>)}
        </nav>

        <div className="min-w-0">
          <Section id="overview" title="Overview" subtitle="Your OTYA identity and verification state.">
            <div className="grid sm:grid-cols-2 gap-3">
              <Info label="Email" value={user.email} />
              <Info label="Email status" value={user.is_verified ? 'Verified' : 'Verification required'} />
              <Info label="Account ID" value={user.id} mono />
              <Info label="Two-step verification" value={twoFactor?.enabled ? 'On' : 'Off'} />
            </div>
          </Section>

          <Section id="personal" title="Personal info" subtitle="Only add details that help account recovery or regional defaults.">
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="Name" value={editName} onChange={setEditName} />
              <Input label="Recovery email" value={recoveryEmail} onChange={setRecoveryEmail} type="email" />
              <Input label="Country / region" value={country} onChange={setCountry} placeholder="UG" />
              <Input label="Language" value={locale} onChange={setLocale} placeholder="en-UG" />
              <Input label="Timezone" value={timezone} onChange={setTimezone} placeholder="Africa/Kampala" />
            </div>
            <button onClick={() => void saveProfile()} disabled={busy} className="cosmos-button rounded-xl min-h-11 px-4 mt-4 text-sm font-bold">Save changes</button>
          </Section>

          <Section id="security" title="Security" subtitle="Verification and account-recovery controls.">
            <SecurityRow title="Primary email" detail={user.is_verified ? 'Verified' : 'Verification required'}>
              {!user.is_verified && <div className="flex flex-wrap gap-2 mt-3">
                <button onClick={() => void sendEmailVerification()} disabled={busy} className="otya-quiet-button rounded-xl min-h-11 px-3 text-sm font-semibold">Send code</button>
                <input value={emailCode} onChange={event => setEmailCode(event.target.value)} placeholder="A1234" className="compact-input" />
                <button onClick={() => void verifyEmail()} disabled={busy} className="cosmos-button rounded-xl min-h-11 px-3 text-sm font-semibold">Verify</button>
              </div>}
            </SecurityRow>

            <SecurityRow title="Phone / Telegram verification" detail={user.phone_verified_at ? `Verified · ${user.phone_number || ''}` : 'Optional account verification method'}>
              <div className="flex flex-wrap gap-2 mt-3">
                <button onClick={() => void connectTelegram()} disabled={busy} className="otya-quiet-button rounded-xl min-h-11 px-3 text-sm font-semibold">Connect Telegram</button>
                <input value={phone} onChange={event => setPhone(event.target.value)} placeholder="+256…" className="compact-input" />
                <button onClick={() => void requestPhoneCode()} disabled={busy} className="otya-quiet-button rounded-xl min-h-11 px-3 text-sm font-semibold">Send code</button>
                {phoneCodeSent && <><input value={phoneCode} onChange={event => setPhoneCode(event.target.value)} placeholder="Code" className="compact-input" /><button onClick={() => void verifyPhoneCode()} disabled={busy} className="cosmos-button rounded-xl min-h-11 px-3 text-sm font-semibold">Verify</button></>}
              </div>
            </SecurityRow>

            <SecurityRow title="Two-step verification" detail={twoFactor?.enabled ? `On · ${twoFactor.recovery_codes_remaining} recovery codes remaining` : twoFactor?.available ? 'Off · authenticator available' : 'Authenticator setup unavailable'}>
              {!twoFactor?.enabled && twoFactor?.available && !setup && <button onClick={() => void startTwoFactorSetup()} disabled={busy} className="cosmos-button rounded-xl min-h-11 px-4 mt-3 text-sm font-bold">Set up authenticator</button>}
              {setup && <div className="mt-4 space-y-3">
                <div className="modern-card p-4 break-all"><div className="otya-kicker mb-2">Authenticator secret</div><code className="text-sm">{setup.secret}</code><p className="text-xs otya-muted mt-3">You can also use the standard otpauth URI with a compatible authenticator.</p></div>
                <div className="flex flex-wrap gap-2"><input value={totpCode} onChange={event => setTotpCode(event.target.value)} placeholder="6-digit code" className="compact-input" /><button onClick={() => void enableTwoFactor()} disabled={busy} className="cosmos-button rounded-xl min-h-11 px-4 text-sm font-bold">Enable</button></div>
              </div>}
              {twoFactor?.enabled && <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-2"><input value={totpCode} onChange={event => setTotpCode(event.target.value)} placeholder="Current authenticator code" className="compact-input" /><button onClick={() => void regenerateRecoveryCodes()} disabled={busy} className="otya-quiet-button rounded-xl min-h-11 px-3 text-sm font-semibold">New recovery codes</button></div>
                <div className="flex flex-wrap gap-2"><input value={disableCode} onChange={event => setDisableCode(event.target.value)} placeholder="Authenticator or recovery code" className="compact-input" /><button onClick={() => void disableTwoFactor()} disabled={busy} className="otya-quiet-button rounded-xl min-h-11 px-3 text-sm font-semibold">Disable 2FA</button></div>
              </div>}
              {recoveryCodes.length > 0 && <div className="modern-card p-4 mt-4"><strong>Save these recovery codes now</strong><p className="text-xs otya-muted mt-1">Each code works once. Store them somewhere private.</p><div className="grid sm:grid-cols-2 gap-2 mt-3 font-mono text-sm">{recoveryCodes.map(code => <code key={code}>{code}</code>)}</div></div>}
            </SecurityRow>
          </Section>

          <Section id="sessions" title="Sessions" subtitle="Review and revoke recorded OTYA sign-ins.">
            <div className="flex justify-end mb-3"><button onClick={() => void revokeAllSessions()} disabled={busy || sessions.length === 0} className="otya-quiet-button rounded-xl min-h-11 px-3 text-sm font-semibold">Sign out all</button></div>
            {sessions.length === 0 ? <Empty text="No recorded sessions yet." /> : <div className="space-y-2">{sessions.map(session => <div key={session.id} className="modern-card p-4 flex items-start justify-between gap-4"><div className="min-w-0"><div className="font-semibold text-sm truncate">{session.user_agent || 'OTYA session'}</div><div className="text-xs otya-muted mt-1">Last used {formatDate(session.last_used_at)}{session.ip ? ` · ${session.ip}` : ''}</div></div><button onClick={() => void revokeSession(session.id)} disabled={busy} className="text-sm font-semibold shrink-0">Sign out</button></div>)}</div>}
          </Section>

          <Section id="connected" title="Connected accounts" subtitle="External identities linked to the same OTYA account.">
            {identities.length === 0 ? <Empty text="No external accounts are connected." /> : <div className="grid sm:grid-cols-2 gap-3">{identities.map((identity, index) => <Info key={`${identity.provider}-${index}`} label={identity.provider} value={identity.provider_username || 'Connected'} />)}</div>}
            {!telegram && <button onClick={() => void connectTelegram()} disabled={busy} className="otya-quiet-button rounded-xl min-h-11 px-4 mt-4 text-sm font-semibold">Connect Telegram</button>}
          </Section>

          <Section id="privacy" title="Data & privacy" subtitle="Legal consent and destructive account controls.">
            <div className="grid sm:grid-cols-3 gap-3 mb-6">
              <Info label="Terms" value={consent?.terms_accepted ? 'Accepted' : 'Not recorded'} />
              <Info label="Privacy policy" value={consent?.privacy_accepted ? 'Accepted' : 'Not recorded'} />
              <Info label="Marketing" value={consent?.marketing_consent ? 'Allowed' : 'Off'} />
            </div>
            <div className="rounded-2xl border p-5" style={{ borderColor: 'color-mix(in srgb, var(--cosmos-error) 45%, var(--cosmos-divider))' }}>
              <h3 className="font-bold">Delete OTYA account</h3>
              <p className="text-sm otya-muted mt-2">Deletes your OTYA cloud account and server sessions. It does not delete music or video stored locally on your device.</p>
              <button onClick={() => void deleteAccount()} disabled={busy} className="mt-4 rounded-xl min-h-11 px-4 text-sm font-bold border" style={{ color: 'var(--cosmos-error)', borderColor: 'var(--cosmos-error)' }}>Delete account</button>
            </div>
          </Section>
        </div>
      </div>

      <style jsx global>{`
        .account-input,.compact-input{border:1px solid var(--cosmos-divider);background:var(--cosmos-card);color:var(--cosmos-text-primary);border-radius:12px;min-height:48px;padding:11px 13px;outline:none;width:100%}.compact-input{width:min(240px,100%)}.account-input:focus,.compact-input:focus{border-color:var(--cosmos-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--cosmos-primary) 12%,transparent)}
      `}</style>
    </main>
  </AccountShell>
}

function AccountShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen flex flex-col" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}><SiteNav /><div className="flex-1">{children}</div><SiteFooter /></div>
}

function Section({ id, title, subtitle, children }: { id: string; title: string; subtitle: string; children: ReactNode }) {
  return <section id={id} className="py-7 border-t first:border-t-0" style={{ borderColor: 'var(--cosmos-divider)', scrollMarginTop: 72 }}><div className="mb-5"><h2 className="text-xl font-black">{title}</h2><p className="text-sm otya-muted mt-1">{subtitle}</p></div>{children}</section>
}

function SecurityRow({ title, detail, children }: { title: string; detail: string; children?: ReactNode }) {
  return <div className="py-5 border-t first:border-t-0" style={{ borderColor: 'var(--cosmos-divider)' }}><div className="font-bold">{title}</div><div className="text-sm otya-muted mt-1">{detail}</div>{children}</div>
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="modern-card p-4 min-w-0"><div className="otya-kicker mb-2">{label}</div><div className={`text-sm break-words ${mono ? 'font-mono' : 'font-semibold'}`}>{value || '—'}</div></div>
}

function Input({ label, value, onChange, placeholder, type = 'text', autoComplete, disabled, autoFocus }: { label?: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; autoComplete?: string; disabled?: boolean; autoFocus?: boolean }) {
  return <label className="block">{label && <span className="block text-xs font-semibold mb-1.5 otya-muted">{label}</span>}<input className="account-input" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} type={type} autoComplete={autoComplete} disabled={disabled} autoFocus={autoFocus} /></label>
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: (value: boolean) => void; children: ReactNode }) {
  return <label className="flex items-start gap-2.5"><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="mt-1" /><span>{children}</span></label>
}

function Notice({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  return <div className="rounded-xl border p-3 text-sm mb-3" style={{ borderColor: tone === 'error' ? 'var(--cosmos-error)' : 'var(--cosmos-divider)', color: tone === 'error' ? 'var(--cosmos-error)' : 'var(--cosmos-text-primary)', background: 'var(--cosmos-card)' }}>{children}</div>
}

function Empty({ text }: { text: string }) {
  return <div className="modern-card p-5 text-sm otya-muted">{text}</div>
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}
