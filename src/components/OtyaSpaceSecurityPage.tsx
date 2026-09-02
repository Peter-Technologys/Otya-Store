'use client'

import Link from 'next/link'
import { ReactNode, useEffect, useState } from 'react'

const API = '/api/account-session'

type User = { email?: string | null; is_verified?: boolean | number; otya_id?: string | null }
type Identity = { provider: string; provider_username?: string | null }
type TwoFactorStatus = { enabled: boolean; recovery_codes_remaining: number; available: boolean }
type TwoFactorSetup = { secret: string; otpauth_uri: string }

async function accountFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  return fetch(`${API}/${path}`, { ...init, headers, credentials: 'same-origin', cache: 'no-store' })
}

function scopedHref(user: User | null, section: string, fallback: string) {
  const id = user?.otya_id?.trim().toUpperCase() ?? ''
  return /^2IS\d{8}$/.test(id) ? `/u/${id}/${section}` : fallback
}

export function OtyaSpaceSecurityPage() {
  const [user, setUser] = useState<User | null>(null)
  const [identities, setIdentities] = useState<Identity[]>([])
  const [twoFactor, setTwoFactor] = useState<TwoFactorStatus | null>(null)
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    void Promise.all([accountFetch('account'), accountFetch('2fa/status')])
      .then(async ([accountResponse, twoFactorResponse]) => {
        if (!accountResponse.ok) throw new Error('account')
        const account = await accountResponse.json().catch(() => ({})) as { user?: User; identities?: Identity[] }
        const factor = twoFactorResponse.ok
          ? await twoFactorResponse.json().catch(() => ({})) as TwoFactorStatus
          : { enabled: false, recovery_codes_remaining: 0, available: false }
        if (cancelled) return
        setUser(account.user ?? null)
        setIdentities(Array.isArray(account.identities) ? account.identities : [])
        setTwoFactor(factor)
      })
      .catch(() => { if (!cancelled) setError('OTYA could not load your security controls. Refresh and try again.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  async function action(task: () => Promise<string>) {
    setBusy(true); setError(''); setNotice('')
    try { setNotice(await task()) } catch (cause) { setError((cause as Error).message) } finally { setBusy(false) }
  }

  async function reloadAccount() {
    const response = await accountFetch('account')
    if (!response.ok) return
    const data = await response.json().catch(() => ({})) as { user?: User; identities?: Identity[] }
    setUser(data.user ?? null)
    setIdentities(Array.isArray(data.identities) ? data.identities : [])
  }

  async function reloadTwoFactor() {
    const response = await accountFetch('2fa/status')
    if (!response.ok) return
    setTwoFactor(await response.json().catch(() => ({})) as TwoFactorStatus)
  }

  async function sendEmailCode() {
    await action(async () => {
      const response = await accountFetch('send-verification', { method: 'POST' })
      const data = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) throw new Error(data.error || 'Could not send verification code.')
      return 'Verification code sent. Only the newest code will work.'
    })
  }

  async function verifyEmail() {
    if (!/^[A-Z][0-9]{4}$/.test(emailCode)) return setError('Enter the 5-character verification code from your email.')
    await action(async () => {
      const response = await accountFetch('verify-email', { method: 'POST', body: JSON.stringify({ otp: emailCode }) })
      const data = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) throw new Error(data.error || 'Could not verify email.')
      setEmailCode('')
      await reloadAccount()
      return 'Email verified.'
    })
  }

  async function startTwoFactor() {
    await action(async () => {
      const response = await accountFetch('2fa/setup', { method: 'POST' })
      const data = await response.json().catch(() => ({})) as { secret?: string; otpauth_uri?: string; error?: string }
      if (!response.ok || !data.secret || !data.otpauth_uri) throw new Error(data.error || 'Could not start authenticator setup.')
      setSetup({ secret: data.secret, otpauth_uri: data.otpauth_uri })
      setTwoFactorCode('')
      setRecoveryCodes([])
      return 'Add OTYA to your authenticator app, then enter its current 6-digit code.'
    })
  }

  async function enableTwoFactor() {
    if (!/^\d{6}$/.test(twoFactorCode)) return setError('Enter the current 6-digit authenticator code.')
    await action(async () => {
      const response = await accountFetch('2fa/enable', { method: 'POST', body: JSON.stringify({ code: twoFactorCode }) })
      const data = await response.json().catch(() => ({})) as { recovery_codes?: string[]; error?: string; sign_in_again?: boolean }
      if (!response.ok) throw new Error(data.error || 'Could not enable two-step verification.')
      setRecoveryCodes(Array.isArray(data.recovery_codes) ? data.recovery_codes : [])
      setSetup(null)
      setTwoFactorCode('')
      await reloadTwoFactor()
      return data.sign_in_again ? 'Two-step verification is on. Save your recovery codes, then sign in again.' : 'Two-step verification is on.'
    })
  }

  async function disableTwoFactor() {
    if (!/^\d{6}$/.test(twoFactorCode)) return setError('Enter the current 6-digit authenticator code.')
    await action(async () => {
      const response = await accountFetch('2fa/disable', { method: 'POST', body: JSON.stringify({ code: twoFactorCode }) })
      const data = await response.json().catch(() => ({})) as { error?: string; sign_in_again?: boolean }
      if (!response.ok) throw new Error(data.error || 'Could not disable two-step verification.')
      setTwoFactorCode('')
      setRecoveryCodes([])
      await reloadTwoFactor()
      if (data.sign_in_again) window.location.replace('/sign-in?security=updated')
      return 'Two-step verification is off.'
    })
  }

  async function regenerateRecoveryCodes() {
    if (!/^\d{6}$/.test(twoFactorCode)) return setError('Enter the current 6-digit authenticator code.')
    await action(async () => {
      const response = await accountFetch('2fa/recovery-codes', { method: 'POST', body: JSON.stringify({ code: twoFactorCode }) })
      const data = await response.json().catch(() => ({})) as { recovery_codes?: string[]; error?: string; sign_in_again?: boolean }
      if (!response.ok || !Array.isArray(data.recovery_codes)) throw new Error(data.error || 'Could not generate new recovery codes.')
      setRecoveryCodes(data.recovery_codes)
      setTwoFactorCode('')
      await reloadTwoFactor()
      return data.sign_in_again ? 'New recovery codes created. Save them now, then sign in again.' : 'New recovery codes created.'
    })
  }

  const google = identities.find(identity => identity.provider === 'google')
  const telegram = identities.find(identity => identity.provider === 'telegram')
  const signInMethodsHref = scopedHref(user, 'account/sign-in-methods', '/account/sign-in-methods/')

  return <main className="px-4 sm:px-7 lg:px-10 py-7 sm:py-9 max-w-[1000px]">
    <header className="mb-7"><div className="text-[11px] font-black uppercase tracking-[.16em] otya-muted">Account</div><h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-[-.045em]">Security</h1><p className="mt-2 text-sm sm:text-base otya-muted">Verification, sign-in methods and protection for this OTYA ID.</p></header>
    {(error || notice) && <div className="mb-5 rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: error ? 'rgba(239,68,68,.3)' : 'var(--cosmos-divider)', background: 'var(--cosmos-card)' }}>{error || notice}</div>}
    {loading ? <Skeleton /> : <div className="space-y-4">
      <Panel title="Primary email">
        <Status title={user?.email || 'No email added'} detail={!user?.email ? 'Add an email from Sign-in methods. Telegram-first accounts are valid without one.' : user.is_verified ? 'Verified' : 'Verification required'} />
        {user?.email && !user.is_verified && <div className="mt-4 flex flex-wrap gap-2"><button onClick={()=>void sendEmailCode()} disabled={busy} className="otya-quiet-button rounded-xl px-3 min-h-10 text-sm font-bold">Send code</button><input value={emailCode} onChange={e=>setEmailCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,5))} autoComplete="one-time-code" placeholder="A1234" className="space-input max-w-[160px]"/><button onClick={()=>void verifyEmail()} disabled={busy || emailCode.length!==5} className="cosmos-button rounded-xl px-3 min-h-10 text-sm font-bold">Verify</button></div>}
      </Panel>

      <Panel title="Sign-in methods">
        <div className="grid sm:grid-cols-3 gap-3"><Status title="Email" detail={user?.email ? 'Connected' : 'Not added'} /><Status title="Google" detail={google ? 'Connected' : 'Not connected'} /><Status title="Telegram" detail={telegram ? `Connected${telegram.provider_username ? ` · ${telegram.provider_username}` : ''}` : 'Not connected'} /></div>
        <Link href={signInMethodsHref} className="inline-flex mt-4 cosmos-button rounded-xl px-4 min-h-10 items-center text-sm font-bold">Manage sign-in methods</Link>
      </Panel>

      <Panel title="Two-step verification">
        {twoFactor?.available === false ? <Status title="Unavailable" detail="Authenticator protection is not available on this deployment." /> : <>
          <Status title={twoFactor?.enabled ? 'On' : 'Off'} detail={twoFactor?.enabled ? `${twoFactor.recovery_codes_remaining} recovery codes remaining` : 'Use an authenticator app to protect password sign-in and sensitive account changes.'} />

          {!twoFactor?.enabled && !setup && <button onClick={()=>void startTwoFactor()} disabled={busy} className="mt-4 cosmos-button rounded-xl px-4 min-h-10 text-sm font-bold">Set up authenticator</button>}

          {setup && <div className="mt-4 rounded-2xl border p-4 space-y-3" style={{ borderColor:'var(--cosmos-divider)', background:'var(--cosmos-card)' }}><div className="text-sm font-black">Authenticator secret</div><div className="font-mono text-sm break-all select-all">{setup.secret}</div><p className="text-sm otya-muted">Add this secret to your authenticator app under OTYA. Then enter the current 6-digit code below.</p><div className="flex flex-wrap gap-2"><input value={twoFactorCode} onChange={e=>setTwoFactorCode(e.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" autoComplete="one-time-code" placeholder="123456" className="space-input max-w-[160px]"/><button onClick={()=>void enableTwoFactor()} disabled={busy || twoFactorCode.length!==6} className="cosmos-button rounded-xl px-4 min-h-10 text-sm font-bold">Enable</button><button onClick={()=>{setSetup(null);setTwoFactorCode('')}} disabled={busy} className="otya-quiet-button rounded-xl px-4 min-h-10 text-sm font-bold">Cancel</button></div></div>}

          {twoFactor?.enabled && <div className="mt-4"><p className="text-sm otya-muted">Enter a current authenticator code before changing this protection or replacing recovery codes.</p><div className="mt-3 flex flex-wrap gap-2"><input value={twoFactorCode} onChange={e=>setTwoFactorCode(e.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" autoComplete="one-time-code" placeholder="123456" className="space-input max-w-[160px]"/><button onClick={()=>void regenerateRecoveryCodes()} disabled={busy || twoFactorCode.length!==6} className="otya-quiet-button rounded-xl px-4 min-h-10 text-sm font-bold">New recovery codes</button><button onClick={()=>void disableTwoFactor()} disabled={busy || twoFactorCode.length!==6} className="otya-quiet-button rounded-xl px-4 min-h-10 text-sm font-bold">Turn off</button></div></div>}

          {recoveryCodes.length>0 && <div className="mt-5 rounded-2xl border p-4" style={{ borderColor:'var(--cosmos-divider)', background:'var(--cosmos-card)' }}><div className="font-black">Save these recovery codes now</div><p className="mt-1 text-sm otya-muted">Each code works once. Keep them somewhere private outside this device.</p><div className="mt-3 grid sm:grid-cols-2 gap-2">{recoveryCodes.map(code=><div key={code} className="font-mono text-sm font-bold rounded-xl border px-3 py-2 select-all" style={{borderColor:'var(--cosmos-divider)'}}>{code}</div>)}</div><button onClick={()=>window.location.replace('/sign-in?security=updated')} className="mt-4 cosmos-button rounded-xl px-4 min-h-10 text-sm font-bold">I saved them · Sign in again</button></div>}
        </>}
      </Panel>
    </div>}
    <style jsx global>{`.space-input{width:100%;min-height:44px;border:1px solid var(--cosmos-divider);background:var(--cosmos-card);color:var(--cosmos-text-primary);border-radius:12px;padding:10px 12px;outline:none}.space-input:focus{border-color:var(--cosmos-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--cosmos-primary) 12%,transparent)}`}</style>
  </main>
}

function Panel({title,children}:{title:string;children:ReactNode}) { return <section className="rounded-[22px] border p-5 sm:p-6" style={{borderColor:'var(--cosmos-divider)',background:'var(--cosmos-surface)'}}><h2 className="text-lg font-black mb-5">{title}</h2>{children}</section> }
function Status({title,detail}:{title:string;detail:string}) { return <div className="rounded-2xl border p-4" style={{borderColor:'var(--cosmos-divider)',background:'var(--cosmos-card)'}}><div className="font-bold break-words">{title}</div><div className="mt-1 text-sm otya-muted">{detail}</div></div> }
function Skeleton() { return <div className="space-y-4"><div className="h-32 rounded-[22px] animate-pulse" style={{background:'var(--cosmos-card)'}}/><div className="h-44 rounded-[22px] animate-pulse" style={{background:'var(--cosmos-card)'}}/><div className="h-48 rounded-[22px] animate-pulse" style={{background:'var(--cosmos-card)'}}/></div> }
