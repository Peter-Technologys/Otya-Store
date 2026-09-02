'use client'

import { useEffect, useState } from 'react'

const API = '/api/account-session'

type User = { email?: string | null; is_verified?: boolean | number; otya_id?: string | null }
type TwoFactor = { enabled: boolean; recovery_codes_remaining: number; available: boolean }
type Setup = { secret: string; otpauth_uri: string }
type Json = Record<string, unknown>

async function accountFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  return fetch(`${API}/${path}`, { ...init, headers, credentials: 'same-origin', cache: 'no-store' })
}

export default function SecurityPage() {
  const [user, setUser] = useState<User | null>(null)
  const [twoFactor, setTwoFactor] = useState<TwoFactor | null>(null)
  const [setup, setSetup] = useState<Setup | null>(null)
  const [emailCode, setEmailCode] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { void load() }, [])

  async function load() {
    const [accountResponse, factorResponse] = await Promise.all([
      accountFetch('account'),
      accountFetch('2fa/status').catch(() => null),
    ])
    const account = await accountResponse.json().catch(() => ({})) as { user?: User; error?: string }
    if (!accountResponse.ok || !account.user) throw new Error(account.error || 'Could not load security settings.')
    setUser(account.user)
    if (factorResponse?.ok) setTwoFactor(await factorResponse.json().catch(() => null) as TwoFactor | null)
  }

  async function run(task: () => Promise<string>) {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try { setNotice(await task()) } catch (cause) { setError((cause as Error).message) } finally { setBusy(false) }
  }

  function errorFrom(data: Json, fallback: string) {
    return typeof data.error === 'string' && data.error ? data.error : fallback
  }

  async function resendVerification() {
    await run(async () => {
      const response = await accountFetch('send-verification', { method: 'POST' })
      const data = await response.json().catch(() => ({})) as Json
      if (!response.ok) throw new Error(errorFrom(data, 'Could not send a verification code.'))
      return 'One verification code was sent. It expires in 10 minutes.'
    })
  }

  async function verifyEmail() {
    if (!emailCode.trim()) return setError('Enter the verification code from your email.')
    await run(async () => {
      const response = await accountFetch('verify-email', { method: 'POST', body: JSON.stringify({ otp: emailCode.trim().toUpperCase() }) })
      const data = await response.json().catch(() => ({})) as Json
      if (!response.ok) throw new Error(errorFrom(data, 'The verification code is invalid or expired.'))
      setEmailCode('')
      await load()
      return 'Email verified.'
    })
  }

  async function startTwoFactor() {
    await run(async () => {
      const response = await accountFetch('2fa/setup', { method: 'POST' })
      const data = await response.json().catch(() => ({})) as Json
      if (!response.ok || typeof data.secret !== 'string' || typeof data.otpauth_uri !== 'string') throw new Error(errorFrom(data, 'Could not start two-step verification.'))
      setSetup({ secret: data.secret, otpauth_uri: data.otpauth_uri })
      setAuthCode('')
      setRecoveryCodes([])
      return 'Add the secret to your authenticator, then enter the current 6-digit code.'
    })
  }

  async function enableTwoFactor() {
    if (!authCode.trim()) return setError('Enter your authenticator code.')
    await run(async () => {
      const response = await accountFetch('2fa/enable', { method: 'POST', body: JSON.stringify({ code: authCode.trim() }) })
      const data = await response.json().catch(() => ({})) as Json
      if (!response.ok) throw new Error(errorFrom(data, 'Could not enable two-step verification.'))
      setRecoveryCodes(Array.isArray(data.recovery_codes) ? data.recovery_codes.map(String) : [])
      setSetup(null); setAuthCode('')
      await load()
      return 'Two-step verification is on. Save your recovery codes now.'
    })
  }

  async function disableTwoFactor() {
    if (!authCode.trim()) return setError('Enter your authenticator code.')
    await run(async () => {
      const response = await accountFetch('2fa/disable', { method: 'POST', body: JSON.stringify({ code: authCode.trim() }) })
      const data = await response.json().catch(() => ({})) as Json
      if (!response.ok) throw new Error(errorFrom(data, 'Could not disable two-step verification.'))
      setAuthCode(''); setRecoveryCodes([])
      await load()
      return 'Two-step verification is off.'
    })
  }

  return <main className="px-4 sm:px-7 lg:px-10 py-7 sm:py-9 max-w-[920px]">
    <Header title="Security" text="Email verification and two-step verification have their own focused page." />
    {error && <Message tone="error">{error}</Message>}
    {notice && <Message tone="ok">{notice}</Message>}

    <section className="grid gap-4">
      <Card title="Email verification" detail={user?.email || 'No primary email'}>
        {user?.is_verified ? <Status text="Verified" good /> : user?.email ? <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end"><label className="grid gap-1.5"><span className="text-xs font-black otya-muted">Verification code</span><input value={emailCode} onChange={event => setEmailCode(event.target.value.toUpperCase())} autoComplete="one-time-code" inputMode="text" maxLength={5} className="min-h-12 rounded-xl border bg-transparent px-3.5 outline-none font-mono tracking-[.18em]" style={{ borderColor: 'var(--cosmos-divider)' }} placeholder="A1234" /></label><button disabled={busy} onClick={() => void verifyEmail()} className="cosmos-button min-h-12 rounded-xl px-4 text-sm font-black disabled:opacity-60">Verify</button><button disabled={busy} onClick={() => void resendVerification()} className="otya-quiet-button min-h-12 rounded-xl px-4 text-sm font-black disabled:opacity-60">Resend</button></div> : <Status text="Add a primary email from Account first" />}
      </Card>

      <Card title="Two-step verification" detail={twoFactor?.enabled ? 'On' : 'Off'}>
        {!twoFactor?.enabled && !setup && <button disabled={busy || twoFactor?.available === false} onClick={() => void startTwoFactor()} className="cosmos-button min-h-11 rounded-xl px-4 text-sm font-black disabled:opacity-60">Set up authenticator</button>}
        {setup && <div className="grid gap-3"><div className="rounded-xl border p-3 text-sm" style={{ borderColor: 'var(--cosmos-divider)' }}><div className="text-xs font-black otya-muted">Authenticator secret</div><div className="mt-1 font-mono break-all">{setup.secret}</div></div><CodeField value={authCode} onChange={setAuthCode}/><button disabled={busy} onClick={() => void enableTwoFactor()} className="cosmos-button min-h-11 rounded-xl px-4 text-sm font-black disabled:opacity-60">Turn on two-step verification</button></div>}
        {twoFactor?.enabled && <div className="grid gap-3"><Status text={`${twoFactor.recovery_codes_remaining} recovery code${twoFactor.recovery_codes_remaining === 1 ? '' : 's'} remaining`} good/><CodeField value={authCode} onChange={setAuthCode}/><button disabled={busy} onClick={() => void disableTwoFactor()} className="otya-quiet-button min-h-11 rounded-xl px-4 text-sm font-black disabled:opacity-60">Turn off</button></div>}
        {recoveryCodes.length > 0 && <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: 'var(--cosmos-divider)' }}><div className="font-black">Save these recovery codes now</div><div className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm">{recoveryCodes.map(code => <div key={code}>{code}</div>)}</div></div>}
      </Card>
    </section>
  </main>
}

function Header({ title, text }: { title: string; text: string }) { return <header className="mb-7"><div className="text-[11px] font-black uppercase tracking-[.16em] otya-muted">Otya Space</div><h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-[-.045em]">{title}</h1><p className="mt-2 text-sm sm:text-base otya-muted">{text}</p></header> }
function Card({ title, detail, children }: { title: string; detail?: string; children: React.ReactNode }) { return <section className="rounded-[24px] border p-5 sm:p-6" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-card)' }}><div className="flex items-start justify-between gap-3 mb-5"><h2 className="text-xl font-black">{title}</h2>{detail && <span className="text-xs font-black otya-muted">{detail}</span>}</div>{children}</section> }
function Status({ text, good = false }: { text: string; good?: boolean }) { return <div className="inline-flex rounded-full border px-3 py-1.5 text-xs font-black" style={{ borderColor: good ? 'rgba(16,185,129,.35)' : 'var(--cosmos-divider)' }}>{text}</div> }
function CodeField({ value, onChange }: { value: string; onChange: (value: string) => void }) { return <label className="grid gap-1.5"><span className="text-xs font-black otya-muted">Authenticator code</span><input value={value} onChange={event => onChange(event.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="min-h-12 rounded-xl border bg-transparent px-3.5 outline-none font-mono tracking-[.18em]" style={{ borderColor: 'var(--cosmos-divider)' }} placeholder="123456" /></label> }
function Message({ tone, children }: { tone: 'error' | 'ok'; children: React.ReactNode }) { return <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${tone === 'error' ? 'border-red-500/25 text-red-700 dark:text-red-200' : 'border-emerald-500/25 text-emerald-700 dark:text-emerald-200'}`}>{children}</div> }
