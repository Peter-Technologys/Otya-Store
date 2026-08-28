'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'

const TERMS_VERSION = '2026-08-28'
const PRIVACY_VERSION = '2026-08-28'

type User = {
  id: string
  email: string
  name?: string | null
  avatar_url?: string | null
  is_verified?: boolean | number
  phone_number?: string | null
  phone_verified_at?: string | null
  phone_verification_method?: string | null
  recovery_email?: string | null
  country_code?: string | null
  locale?: string | null
  timezone?: string | null
}

type Identity = { provider: string; provider_username?: string | null }
type Product = { product_id: string; status: string }
type Session = { id: string; created_at: string; last_used_at: string; ip?: string | null; user_agent?: string | null }
type TwoFactorStatus = { enabled: boolean; recovery_codes_remaining: number; available: boolean }
type TwoFactorSetup = { secret: string; otpauth_uri: string }
type Model = { id: string; name: string; provider: string; description?: string }
type Consent = { terms_accepted?: number; privacy_accepted?: number; marketing_consent?: number }

export default function AccountPage() {
  const [token, setToken] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [identities, setIdentities] = useState<Identity[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [twoFactor, setTwoFactor] = useState<TwoFactorStatus | null>(null)
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [consent, setConsent] = useState<Consent | null>(null)
  const [models, setModels] = useState<Model[]>([])
  const [model, setModel] = useState('otya-smart')

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
    const stored = sessionStorage.getItem('otya_access_token') || ''
    setToken(stored)
    setModel(localStorage.getItem('otya_ai_model') || 'otya-smart')
    setLocale(navigator.language || '')
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || '')
  }, [])

  useEffect(() => {
    if (token) void refreshAll(token)
  }, [token])

  function headers(t = token) {
    return { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }
  }

  function saveAuth(data: Record<string, any>) {
    sessionStorage.setItem('otya_access_token', data.access_token || '')
    sessionStorage.setItem('otya_refresh_token', data.refresh_token || '')
    sessionStorage.setItem('otya_ai_user', JSON.stringify(data.user || {}))
    setToken(data.access_token || '')
    setUser(data.user || null)
    setPassword('')
    setChallenge(false)
    setSecondFactor('')
  }

  async function refreshAll(t: string) {
    await Promise.all([
      loadAccount(t), loadTwoFactor(t), loadSessions(t), loadConsent(t), loadModels(t),
    ])
  }

  async function loadAccount(t: string) {
    try {
      const r = await fetch('/auth/account', { headers: headers(t), cache: 'no-store' })
      const d = await r.json().catch(() => ({}))
      if (r.status === 401) { await signOut(); return }
      if (!r.ok) throw new Error(d.error || 'Could not load your OTYA account.')
      const u = d.user as User
      setUser(u)
      setIdentities(d.identities || [])
      setProducts(d.products || [])
      setEditName(u.name || '')
      setRecoveryEmail(u.recovery_email || '')
      setCountry(u.country_code || '')
      setLocale(u.locale || navigator.language || '')
      setTimezone(u.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || '')
      setPhone(u.phone_number || '')
    } catch (e) { setError((e as Error).message) }
  }

  async function loadTwoFactor(t: string) {
    try {
      const r = await fetch('/auth/2fa/status', { headers: headers(t), cache: 'no-store' })
      const d = await r.json().catch(() => ({}))
      if (r.ok) setTwoFactor(d)
    } catch {}
  }

  async function loadSessions(t: string) {
    try {
      const r = await fetch('/auth/sessions', { headers: headers(t), cache: 'no-store' })
      const d = await r.json().catch(() => ({}))
      if (r.ok) setSessions(d.sessions || [])
    } catch {}
  }

  async function loadConsent(t: string) {
    try {
      const r = await fetch('/auth/consent', { headers: headers(t), cache: 'no-store' })
      const d = await r.json().catch(() => ({}))
      if (r.ok) setConsent(d.consent || null)
    } catch {}
  }

  async function loadModels(t: string) {
    try {
      const r = await fetch('/api/ai/chat?models=1', { headers: headers(t), cache: 'no-store' })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) return
      const rows = d.models || []
      setModels(rows)
      const saved = localStorage.getItem('otya_ai_model') || d.default_model || 'otya-smart'
      const next = rows.some((m: Model) => m.id === saved) ? saved : (d.default_model || 'otya-smart')
      setModel(next)
      localStorage.setItem('otya_ai_model', next)
    } catch {}
  }

  async function submitAuth(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) return
    if (registering && (!terms || !privacy)) {
      setError('Accept the OTYA Terms and Privacy Policy to create your account.')
      return
    }
    if (challenge && !secondFactor.trim()) {
      setError(useRecovery ? 'Enter a recovery code.' : 'Enter your 6-digit authenticator code.')
      return
    }
    setBusy(true); setError(''); setNotice('')
    try {
      const endpoint = registering ? '/auth/register' : '/auth/login'
      const payload = registering ? {
        email: email.trim(), password, name: name.trim() || undefined,
        terms_accepted: true, terms_version: TERMS_VERSION,
        privacy_accepted: true, privacy_version: PRIVACY_VERSION,
        marketing_consent: marketing,
      } : {
        email: email.trim(), password,
        ...(challenge && !useRecovery ? { totp_code: secondFactor.trim() } : {}),
        ...(challenge && useRecovery ? { recovery_code: secondFactor.trim() } : {}),
      }
      const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        if (d.code === 'TWO_FACTOR_REQUIRED' || d.code === 'TWO_FACTOR_INVALID') {
          setChallenge(true)
          setSecondFactor('')
          setError(d.error || 'Two-step verification is required.')
          return
        }
        throw new Error(d.error || (registering ? 'Account creation failed.' : 'Sign in failed.'))
      }
      saveAuth(d)
    } catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }

  async function signOut() {
    const refresh = sessionStorage.getItem('otya_refresh_token') || ''
    try {
      if (refresh) await fetch('/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: refresh }) })
    } catch {}
    sessionStorage.removeItem('otya_access_token')
    sessionStorage.removeItem('otya_refresh_token')
    sessionStorage.removeItem('otya_ai_user')
    setToken(''); setUser(null); setSessions([]); setTwoFactor(null); setConsent(null)
  }

  async function saveProfile() {
    setBusy(true); setError(''); setNotice('')
    try {
      const r = await fetch('/auth/account', { method: 'PATCH', headers: headers(), body: JSON.stringify({ name: editName || null, recovery_email: recoveryEmail || null, country_code: country || null, locale: locale || null, timezone: timezone || null }) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'Could not save personal info.')
      setNotice('Personal info saved.')
      await loadAccount(token)
    } catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }

  async function sendEmailVerification() {
    setBusy(true); setError(''); setNotice('')
    try {
      const r = await fetch('/auth/send-verification', { method: 'POST', headers: headers() })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'Could not send email verification code.')
      setNotice('Email verification code sent.')
    } catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }

  async function verifyEmail() {
    if (!emailCode.trim()) return
    setBusy(true); setError(''); setNotice('')
    try {
      const r = await fetch('/auth/verify-email', { method: 'POST', headers: headers(), body: JSON.stringify({ otp: emailCode.trim() }) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'Could not verify email.')
      setEmailCode(''); setNotice('Email verified.')
      await loadAccount(token)
    } catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }

  async function connectTelegram() {
    setBusy(true); setError(''); setNotice('')
    try {
      const r = await fetch('/auth/telegram/start', { method: 'POST', headers: headers() })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'Telegram linking is unavailable.')
      window.location.assign(d.authorization_url)
    } catch (e) { setError((e as Error).message); setBusy(false) }
  }

  async function requestPhoneCode() {
    if (!phone.trim()) return
    setBusy(true); setError(''); setNotice('')
    try {
      const r = await fetch('/auth/phone/request', { method: 'POST', headers: headers(), body: JSON.stringify({ phone_number: phone.trim() }) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'Could not send a verification code.')
      setPhoneCodeSent(true); setNotice(d.message || 'Verification code sent.')
    } catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }

  async function verifyPhoneCode() {
    if (!phoneCode.trim()) return
    setBusy(true); setError(''); setNotice('')
    try {
      const r = await fetch('/auth/phone/verify', { method: 'POST', headers: headers(), body: JSON.stringify({ code: phoneCode.trim() }) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'Could not verify phone.')
      setPhoneCode(''); setPhoneCodeSent(false); setNotice('Phone number verified.')
      await loadAccount(token)
    } catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }

  async function startTwoFactorSetup() {
    setBusy(true); setError(''); setNotice(''); setRecoveryCodes([])
    try {
      const r = await fetch('/auth/2fa/setup', { method: 'POST', headers: headers() })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'Could not start two-step verification setup.')
      setSetup(d)
      setNotice('Add the secret to your authenticator app, then verify a current code.')
    } catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }

  async function enableTwoFactor() {
    if (!totpCode.trim()) return
    setBusy(true); setError(''); setNotice('')
    try {
      const r = await fetch('/auth/2fa/enable', { method: 'POST', headers: headers(), body: JSON.stringify({ code: totpCode.trim() }) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'Could not enable two-step verification.')
      setRecoveryCodes(d.recovery_codes || [])
      setSetup(null); setTotpCode('')
      setNotice('Two-step verification is enabled. Save the recovery codes below before leaving this page.')
      await loadTwoFactor(token)
    } catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }

  async function disableTwoFactor() {
    if (!disableCode.trim()) return
    setBusy(true); setError(''); setNotice('')
    try {
      const r = await fetch('/auth/2fa/disable', { method: 'POST', headers: headers(), body: JSON.stringify(disableCode.replace(/\D/g, '').length === 6 ? { code: disableCode.trim() } : { recovery_code: disableCode.trim() }) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'Could not disable two-step verification.')
      setDisableCode(''); setRecoveryCodes([]); setNotice('Two-step verification disabled.')
      await loadTwoFactor(token)
    } catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }

  async function regenerateRecoveryCodes() {
    if (!totpCode.trim()) return
    setBusy(true); setError(''); setNotice('')
    try {
      const r = await fetch('/auth/2fa/recovery-codes', { method: 'POST', headers: headers(), body: JSON.stringify({ code: totpCode.trim() }) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'Could not regenerate recovery codes.')
      setRecoveryCodes(d.recovery_codes || []); setTotpCode('')
      setNotice('New recovery codes generated. Previous recovery codes no longer work.')
      await loadTwoFactor(token)
    } catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }

  async function revokeSession(id: string) {
    if (!confirm('Sign this session out?')) return
    try {
      const r = await fetch('/auth/sessions', { method: 'DELETE', headers: headers(), body: JSON.stringify({ session_id: id }) })
      if (r.ok) await loadSessions(token)
    } catch {}
  }

  async function revokeAllSessions() {
    if (!confirm('Sign out all recorded OTYA sessions? You may need to sign in again.')) return
    try {
      const r = await fetch('/auth/sessions/revoke-all', { method: 'POST', headers: headers() })
      if (r.ok) { setNotice('Recorded sessions revoked.'); await loadSessions(token) }
    } catch {}
  }

  function chooseModel(id: string) {
    setModel(id); localStorage.setItem('otya_ai_model', id)
  }

  if (!token) return <main className="min-h-[100dvh] grid place-items-center p-4" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
    <form onSubmit={submitAuth} className="w-full max-w-md rounded-3xl border p-6 sm:p-8" style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }}>
      <div className="text-sm font-bold" style={{ color: 'var(--cosmos-primary)' }}>OTYA</div>
      <h1 className="text-3xl font-bold mt-1">{challenge ? 'Two-step verification' : registering ? 'Create your OTYA account' : 'Sign in to OTYA'}</h1>
      <p className="text-sm opacity-65 mt-2 mb-6">{challenge ? 'Confirm this sign-in with your authenticator or a recovery code.' : 'One account across OTYA products and services.'}</p>
      {error && <div className="mb-3 text-sm text-red-500">{error}</div>}
      {!challenge && registering && <input value={name} onChange={e => setName(e.target.value)} placeholder="Name (optional)" autoComplete="name" className="input" />}
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" autoComplete="email" disabled={challenge} className="input" />
      <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" autoComplete={registering ? 'new-password' : 'current-password'} disabled={challenge} className="input" />
      {challenge && <><input value={secondFactor} onChange={e => setSecondFactor(e.target.value)} placeholder={useRecovery ? 'Recovery code' : '6-digit authenticator code'} inputMode={useRecovery ? undefined : 'numeric'} autoFocus className="input" /><button type="button" onClick={() => { setUseRecovery(v => !v); setSecondFactor(''); setError('') }} className="w-full text-sm font-semibold opacity-70 mt-1">{useRecovery ? 'Use authenticator code instead' : 'Use a recovery code instead'}</button></>}
      {!challenge && registering && <div className="mt-3 space-y-2 text-sm"><label className="flex gap-2"><input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} /><span>I accept the <Link href="/terms" className="font-semibold">OTYA Terms</Link>.</span></label><label className="flex gap-2"><input type="checkbox" checked={privacy} onChange={e => setPrivacy(e.target.checked)} /><span>I accept the <Link href="/privacy" className="font-semibold">OTYA Privacy Policy</Link>.</span></label><label className="flex gap-2"><input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)} /><span>Send me optional OTYA news.</span></label></div>}
      <button disabled={busy} className="cosmos-button w-full rounded-xl py-3 mt-4 font-semibold">{busy ? 'Please wait…' : challenge ? 'Verify and sign in' : registering ? 'Create OTYA account' : 'Sign in'}</button>
      {!challenge && <button type="button" onClick={() => { setRegistering(v => !v); setError('') }} className="w-full mt-3 text-sm font-semibold opacity-70">{registering ? 'Already have an account? Sign in' : 'New to OTYA? Create an account'}</button>}
      {challenge && <button type="button" onClick={() => { setChallenge(false); setSecondFactor(''); setError('') }} className="w-full mt-3 text-sm font-semibold opacity-70">Use another account</button>}
      <div className="flex justify-center gap-4 mt-5 text-sm"><Link href="/ai">AI</Link><Link href="/docs">Docs</Link></div>
      <style jsx>{`.input{width:100%;border:1px solid var(--cosmos-divider);background:transparent;border-radius:12px;padding:12px 14px;margin-bottom:12px;outline:none}`}</style>
    </form>
  </main>

  const telegram = identities.find(i => i.provider === 'telegram')
  return <main className="min-h-[100dvh] p-4 sm:p-6" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}><div className="max-w-6xl mx-auto">
    <header className="flex items-start justify-between gap-4 mb-7"><div><div className="text-sm font-bold" style={{ color: 'var(--cosmos-primary)' }}>OTYA ACCOUNT</div><h1 className="text-3xl sm:text-4xl font-bold mt-1">Your OTYA Account</h1><p className="text-sm opacity-60 mt-1">Identity, security, privacy and connected products.</p></div><button onClick={() => void signOut()} className="rounded-xl border px-4 py-2 text-sm" style={{ borderColor: 'var(--cosmos-divider)' }}>Sign out</button></header>
    {(error || notice) && <div className={`mb-5 rounded-xl border p-3 text-sm ${error ? 'text-red-500' : ''}`} style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-card)' }}>{error || notice}</div>}

    <div className="grid md:grid-cols-[220px_1fr] gap-5">
      <aside className="md:sticky md:top-20 md:self-start rounded-2xl border p-2" style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }}>{[['Home','#home'],['Personal info','#personal'],['Security','#security'],['Sessions','#sessions'],['Data & privacy','#privacy'],['Connected accounts','#connected'],['Products','#products'],['OTYA AI','#ai'],['Docs','/docs']].map(([label, href]) => <a key={label} href={href} className="block rounded-xl px-3 py-2.5 text-sm">{label}</a>)}</aside>
      <div className="space-y-5">
        <Card id="home" title={`Welcome${user?.name ? `, ${user.name}` : ''}`}><p>One identity for OTYA Player, OTYA AI and future OTYA products.</p><p className="mt-2 text-sm opacity-60">{user?.email} · Account {user?.id?.slice(0,8)}…</p></Card>

        <Card id="personal" title="Personal info"><p className="text-sm opacity-60 mb-4">Keep signup simple. Add recovery and regional preferences only when useful.</p><div className="grid sm:grid-cols-2 gap-3"><Field label="Name" value={editName} setValue={setEditName}/><Field label="Recovery email" value={recoveryEmail} setValue={setRecoveryEmail}/><Field label="Country / region" value={country} setValue={setCountry} placeholder="UG"/><Field label="Language" value={locale} setValue={setLocale} placeholder="en-UG"/><Field label="Timezone" value={timezone} setValue={setTimezone} placeholder="Africa/Kampala"/></div><button onClick={() => void saveProfile()} disabled={busy} className="cosmos-button rounded-xl px-4 py-2.5 mt-4 text-sm font-semibold">Save personal info</button></Card>

        <Card id="security" title="Security">
          <SecurityBox title="Primary email" subtitle={user?.is_verified ? 'Verified' : 'Verification required'}>{!user?.is_verified && <div className="flex flex-wrap gap-2 mt-3"><button onClick={() => void sendEmailVerification()} className="button">Send code</button><input value={emailCode} onChange={e => setEmailCode(e.target.value)} placeholder="A1234" className="smallInput"/><button onClick={() => void verifyEmail()} className="button">Verify</button></div>}</SecurityBox>
          <SecurityBox title="Phone number" subtitle={user?.phone_verified_at ? `Verified · ${user.phone_number}` : 'Optional recovery/verification method'}><div className="flex flex-wrap gap-2 mt-3"><button onClick={() => void connectTelegram()} className="cosmos-button rounded-xl px-3 py-2 text-sm font-semibold">Verify with Telegram</button><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+256…" className="smallInput"/><button onClick={() => void requestPhoneCode()} className="button">Send Telegram code</button>{phoneCodeSent && <><input value={phoneCode} onChange={e => setPhoneCode(e.target.value)} placeholder="6 digits" className="smallInput"/><button onClick={() => void verifyPhoneCode()} className="button">Verify</button></>}</div></SecurityBox>
          <SecurityBox title="Two-step verification" subtitle={twoFactor?.enabled ? `On · ${twoFactor.recovery_codes_remaining} recovery codes left` : twoFactor?.available ? 'Off · authenticator available' : 'Authenticator setup is not configured on the server yet'}>
            {!twoFactor?.enabled && twoFactor?.available && !setup && <button onClick={() => void startTwoFactorSetup()} className="cosmos-button rounded-xl px-4 py-2 mt-3 text-sm font-semibold">Set up authenticator</button>}
            {setup && <div className="mt-3 space-y-3"><div className="rounded-xl border p-3 break-all" style={{ borderColor:'var(--cosmos-divider)' }}><div className="text-xs opacity-50">Authenticator secret</div><code>{setup.secret}</code><div className="text-xs opacity-50 mt-2">You can also copy the standard otpauth URI into a compatible authenticator.</div></div><div className="flex gap-2"><input value={totpCode} onChange={e => setTotpCode(e.target.value)} placeholder="6-digit code" className="smallInput"/><button onClick={() => void enableTwoFactor()} className="cosmos-button rounded-xl px-4 text-sm font-semibold">Enable</button></div></div>}
            {twoFactor?.enabled && <div className="mt-3 space-y-3"><div className="flex flex-wrap gap-2"><input value={totpCode} onChange={e => setTotpCode(e.target.value)} placeholder="Current authenticator code" className="smallInput"/><button onClick={() => void regenerateRecoveryCodes()} className="button">New recovery codes</button></div><div className="flex flex-wrap gap-2"><input value={disableCode} onChange={e => setDisableCode(e.target.value)} placeholder="Authenticator or recovery code" className="smallInput"/><button onClick={() => void disableTwoFactor()} className="button">Disable 2FA</button></div></div>}
            {recoveryCodes.length > 0 && <div className="mt-4 rounded-xl border p-4" style={{ borderColor:'var(--cosmos-divider)' }}><strong>Save these recovery codes now</strong><p className="text-xs opacity-60 mt-1">Each works once. They will not be shown again.</p><div className="grid sm:grid-cols-2 gap-2 mt-3 font-mono text-sm">{recoveryCodes.map(code => <code key={code}>{code}</code>)}</div></div>}
          </SecurityBox>
        </Card>

        <Card id="sessions" title="Your sessions"><div className="flex justify-between gap-3 mb-4"><p className="text-sm opacity-60">New OTYA sign-ins appear here with recent device/network metadata.</p><button onClick={() => void revokeAllSessions()} className="button shrink-0">Sign out all</button></div>{sessions.length === 0 ? <p className="text-sm opacity-60">No recorded sessions yet. Existing sessions gain metadata after the next sign-in.</p> : <div className="space-y-2">{sessions.map(s => <div key={s.id} className="rounded-xl border p-3 flex items-start justify-between gap-3" style={{borderColor:'var(--cosmos-divider)'}}><div className="min-w-0"><div className="text-sm font-semibold truncate">{friendlyAgent(s.user_agent)}</div><div className="text-xs opacity-55 mt-1">Last used {formatTime(s.last_used_at)}{s.ip ? ` · ${s.ip}` : ''}</div></div><button onClick={() => void revokeSession(s.id)} className="text-sm font-semibold">Sign out</button></div>)}</div>}</Card>

        <Card id="privacy" title="Data & privacy"><div className="grid sm:grid-cols-3 gap-3"><Status label="Terms" value={consent?.terms_accepted ? 'Accepted' : 'Review needed'}/><Status label="Privacy" value={consent?.privacy_accepted ? 'Accepted' : 'Review needed'}/><Status label="Marketing" value={consent?.marketing_consent ? 'On' : 'Off'}/></div><div className="flex flex-wrap gap-3 mt-4"><Link href="/docs" className="button">Open Docs</Link><a href="mailto:support@petersmartlink.com?subject=OTYA%20Account%20Data%20Request" className="button">Request my data</a></div></Card>

        <Card id="connected" title="Connected accounts"><div className="space-y-2"><SecurityBox title="Telegram" subtitle={telegram ? `Connected${telegram.provider_username ? ` as @${telegram.provider_username}` : ''}` : 'Not connected'}><button onClick={() => void connectTelegram()} className="button mt-2">{telegram ? 'Reconnect' : 'Connect'}</button></SecurityBox><SecurityBox title="Google" subtitle="Google Sign-In remains a server-verified OTYA authentication method." /></div></Card>

        <Card id="products" title="Your OTYA products"><p className="text-sm opacity-60">Products use the same account ID but keep product-private data separately scoped.</p><div className="rounded-xl border p-4 mt-3 flex justify-between" style={{borderColor:'var(--cosmos-divider)'}}><div><strong>OTYA Player</strong><div className="text-xs opacity-55">Android · offline-first media</div></div><Link href="/otya-player" className="font-semibold">View</Link></div>{products.length > 0 && <p className="text-xs opacity-50 mt-3">Recorded: {products.map(p => p.product_id).join(', ')}</p>}</Card>

        <Card id="ai" title="OTYA AI"><p className="text-sm opacity-60">Standalone OTYA assistant service. Choose your signed-in model preference here.</p><select value={model} onChange={e => chooseModel(e.target.value)} className="mt-4 w-full sm:max-w-md rounded-xl border bg-transparent px-3 py-3" style={{borderColor:'var(--cosmos-divider)'}}>{models.map(m => <option key={m.id} value={m.id}>{m.name} · {m.provider}</option>)}</select><div className="mt-4"><Link href="/ai" className="cosmos-button rounded-xl px-4 py-2.5 text-sm font-semibold">Open OTYA AI</Link></div></Card>
      </div>
    </div>
  </div><style jsx global>{`.button{display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--cosmos-divider);border-radius:12px;padding:8px 12px;font-size:14px;font-weight:600}.smallInput{min-width:180px;flex:1;border:1px solid var(--cosmos-divider);background:transparent;border-radius:12px;padding:9px 12px;outline:none}`}</style></main>
}

function Card({ id, title, children }: { id: string; title: string; children: React.ReactNode }) { return <section id={id} className="rounded-3xl border p-5 sm:p-6" style={{ background:'var(--cosmos-card)', borderColor:'var(--cosmos-divider)' }}><h2 className="text-xl font-bold mb-3">{title}</h2>{children}</section> }
function SecurityBox({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) { return <div className="rounded-2xl border p-4 mb-3" style={{borderColor:'var(--cosmos-divider)'}}><strong>{title}</strong><div className="text-sm opacity-55 mt-1">{subtitle}</div>{children}</div> }
function Field({ label, value, setValue, placeholder }: { label: string; value: string; setValue: (v: string) => void; placeholder?: string }) { return <label className="rounded-xl border p-3 block" style={{borderColor:'var(--cosmos-divider)'}}><div className="text-xs opacity-50 mb-1">{label}</div><input value={value} onChange={e => setValue(e.target.value)} placeholder={placeholder} className="w-full bg-transparent outline-none text-sm" /></label> }
function Status({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border p-4" style={{borderColor:'var(--cosmos-divider)'}}><div className="text-xs opacity-50">{label}</div><div className="font-semibold mt-1">{value}</div></div> }
function friendlyAgent(value?: string | null) { if (!value) return 'OTYA session'; if (/Android/i.test(value)) return 'Android device'; if (/iPhone|iPad/i.test(value)) return 'Apple device'; if (/Chrome/i.test(value)) return 'Chrome browser'; if (/Firefox/i.test(value)) return 'Firefox browser'; if (/Safari/i.test(value)) return 'Safari browser'; return value.slice(0, 60) }
function formatTime(value: string) { try { return new Intl.DateTimeFormat(undefined, { dateStyle:'medium', timeStyle:'short' }).format(new Date(value)) } catch { return value } }
