'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

const API = '/api/account-session'

type User = {
  id?: string
  otya_id?: string | null
  email: string | null
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
type Session = { id: string; created_at: string; last_used_at: string; ip?: string | null; user_agent?: string | null }
type TwoFactorStatus = { enabled: boolean; recovery_codes_remaining: number; available: boolean }
type TwoFactorSetup = { secret: string; otpauth_uri: string }
type Consent = { terms_accepted?: number; privacy_accepted?: number; marketing_consent?: number }
type Json = Record<string, unknown>

async function accountFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  return fetch(`${API}/${path}`, { ...init, headers, credentials: 'same-origin', cache: 'no-store' })
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null)
  const [identities, setIdentities] = useState<Identity[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [twoFactor, setTwoFactor] = useState<TwoFactorStatus | null>(null)
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [consent, setConsent] = useState<Consent | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [country, setCountry] = useState('')
  const [locale, setLocale] = useState('')
  const [timezone, setTimezone] = useState('')
  const [emailCode, setEmailCode] = useState('')

  useEffect(() => {
    setLocale(navigator.language || '')
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || '')
    void loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const sessionResponse = await accountFetch('session')
      const sessionData = await sessionResponse.json().catch(() => ({})) as Json
      if (!sessionResponse.ok || sessionData.authenticated !== true || !sessionData.user) {
        window.location.replace('/sign-in')
        return
      }
      hydrate(sessionData)
      await Promise.all([loadAccount(), loadSessions(), loadTwoFactor(), loadConsent()])
    } catch {
      setError('Otya Space could not load your account data. Refresh and try again.')
    } finally {
      setLoading(false)
    }
  }

  function hydrate(data: Json) {
    const next = data.user as User | undefined
    if (!next?.id) return
    setUser(next)
    setIdentities(Array.isArray(data.identities) ? data.identities as Identity[] : [])
    setName(next.name || '')
    setRecoveryEmail(next.recovery_email || '')
    setCountry(next.country_code || '')
    setLocale(next.locale || navigator.language || '')
    setTimezone(next.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || '')
  }

  async function loadAccount() {
    const response = await accountFetch('account')
    const data = await response.json().catch(() => ({})) as Json
    if (response.ok && data.user) hydrate(data)
  }

  async function loadSessions() {
    const response = await accountFetch('sessions').catch(() => null)
    if (!response?.ok) return
    const data = await response.json().catch(() => ({})) as { sessions?: Session[] }
    setSessions(Array.isArray(data.sessions) ? data.sessions : [])
  }

  async function loadTwoFactor() {
    const response = await accountFetch('2fa/status').catch(() => null)
    if (!response?.ok) return
    const data = await response.json().catch(() => ({})) as TwoFactorStatus
    setTwoFactor(data)
  }

  async function loadConsent() {
    const response = await accountFetch('consent').catch(() => null)
    if (!response?.ok) return
    const data = await response.json().catch(() => ({})) as { consent?: Consent }
    setConsent(data.consent || null)
  }

  async function action(task: () => Promise<string>) {
    setBusy(true); setError(''); setNotice('')
    try { setNotice(await task()) } catch (cause) { setError((cause as Error).message) } finally { setBusy(false) }
  }

  async function saveProfile() {
    await action(async () => {
      const response = await accountFetch('account', { method: 'PATCH', body: JSON.stringify({ name: name.trim() || null, recovery_email: recoveryEmail.trim() || null, country_code: country.trim() || null, locale: locale.trim() || null, timezone: timezone.trim() || null }) })
      const data = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) throw new Error(data.error || 'Could not save account settings.')
      await loadAccount()
      return 'Account settings saved.'
    })
  }

  async function sendEmailCode() {
    await action(async () => {
      const response = await accountFetch('send-verification', { method: 'POST' })
      const data = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) throw new Error(data.error || 'Could not send verification code.')
      return 'Verification code sent.'
    })
  }

  async function verifyEmail() {
    if (!emailCode.trim()) return
    await action(async () => {
      const response = await accountFetch('verify-email', { method: 'POST', body: JSON.stringify({ otp: emailCode.trim() }) })
      const data = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) throw new Error(data.error || 'Could not verify email.')
      setEmailCode('')
      await loadAccount()
      return 'Email verified.'
    })
  }

  async function startTwoFactor() {
    await action(async () => {
      const response = await accountFetch('2fa/setup', { method: 'POST' })
      const data = await response.json().catch(() => ({})) as { secret?: string; otpauth_uri?: string; error?: string }
      if (!response.ok || !data.secret || !data.otpauth_uri) throw new Error(data.error || 'Could not start two-step verification setup.')
      setTwoFactorSetup({ secret: data.secret, otpauth_uri: data.otpauth_uri })
      setTwoFactorCode('')
      setRecoveryCodes([])
      return 'Add Otya to your authenticator app, then enter the 6-digit code.'
    })
  }

  async function enableTwoFactor() {
    if (!twoFactorCode.trim()) return
    await action(async () => {
      const response = await accountFetch('2fa/enable', { method: 'POST', body: JSON.stringify({ code: twoFactorCode.trim() }) })
      const data = await response.json().catch(() => ({})) as { recovery_codes?: string[]; error?: string; sign_in_again?: boolean }
      if (!response.ok) throw new Error(data.error || 'Could not enable two-step verification.')
      setRecoveryCodes(Array.isArray(data.recovery_codes) ? data.recovery_codes : [])
      setTwoFactorSetup(null)
      setTwoFactorCode('')
      setTwoFactor(current => current ? { ...current, enabled: true, recovery_codes_remaining: data.recovery_codes?.length ?? 0 } : { enabled: true, recovery_codes_remaining: data.recovery_codes?.length ?? 0, available: true })
      return data.sign_in_again ? 'Two-step verification is on. Save the recovery codes below, then sign in again.' : 'Two-step verification is on.'
    })
  }

  async function disableTwoFactor() {
    if (!twoFactorCode.trim()) return
    await action(async () => {
      const response = await accountFetch('2fa/disable', { method: 'POST', body: JSON.stringify({ code: twoFactorCode.trim() }) })
      const data = await response.json().catch(() => ({})) as { error?: string; sign_in_again?: boolean }
      if (!response.ok) throw new Error(data.error || 'Could not disable two-step verification.')
      setTwoFactorCode('')
      setRecoveryCodes([])
      setTwoFactor(current => current ? { ...current, enabled: false, recovery_codes_remaining: 0 } : current)
      if (data.sign_in_again) window.location.replace('/sign-in?security=updated')
      return 'Two-step verification is off.'
    })
  }

  async function regenerateRecoveryCodes() {
    if (!twoFactorCode.trim()) return
    await action(async () => {
      const response = await accountFetch('2fa/recovery-codes', { method: 'POST', body: JSON.stringify({ code: twoFactorCode.trim() }) })
      const data = await response.json().catch(() => ({})) as { recovery_codes?: string[]; error?: string; sign_in_again?: boolean }
      if (!response.ok || !Array.isArray(data.recovery_codes)) throw new Error(data.error || 'Could not generate new recovery codes.')
      setRecoveryCodes(data.recovery_codes)
      setTwoFactorCode('')
      setTwoFactor(current => current ? { ...current, recovery_codes_remaining: data.recovery_codes?.length ?? 0 } : current)
      return data.sign_in_again ? 'New recovery codes created. Save them now, then sign in again.' : 'New recovery codes created.'
    })
  }

  async function connectTelegram() {
    await action(async () => {
      const response = await accountFetch('telegram/start', { method: 'POST' })
      const data = await response.json().catch(() => ({})) as { authorization_url?: string; error?: string }
      if (!response.ok || !data.authorization_url) throw new Error(data.error || 'Telegram linking is unavailable.')
      window.location.assign(data.authorization_url)
      return ''
    })
  }

  async function revokeSession(id: string) {
    await action(async () => {
      const response = await accountFetch('sessions', { method: 'DELETE', body: JSON.stringify({ session_id: id }) })
      const data = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) throw new Error(data.error || 'Could not sign that session out.')
      await loadSessions()
      return 'Session signed out.'
    })
  }

  async function revokeAll() {
    await action(async () => {
      const response = await accountFetch('sessions/revoke-all', { method: 'POST' })
      const data = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) throw new Error(data.error || 'Could not revoke sessions.')
      await loadSessions()
      return 'All recorded sessions signed out.'
    })
  }

  const telegram = identities.find(identity => identity.provider === 'telegram')
  const google = identities.find(identity => identity.provider === 'google')
  const securityScore = useMemo(() => {
    if (!user) return 0
    let value = 30
    if (user.is_verified) value += 25
    if (twoFactor?.enabled) value += 25
    if (telegram) value += 10
    if (user.phone_verified_at) value += 10
    return Math.min(100, value)
  }, [user, twoFactor, telegram])

  if (loading && !user) return <div className="min-h-[65vh] grid place-items-center"><div className="text-center"><div className="h-10 w-10 rounded-2xl mx-auto animate-pulse" style={{ background: 'var(--cosmos-primary)' }} /><p className="mt-3 text-sm otya-muted">Loading Otya Space…</p></div></div>
  if (!user) return null

  return <main className="px-4 sm:px-7 lg:px-10 py-7 sm:py-9 max-w-[1180px]">
    <div className="mb-7">
      <div className="text-[11px] font-black uppercase tracking-[.16em] otya-muted">Otya Space</div>
      <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-[-.045em]">Overview</h1>
      <p className="mt-2 text-sm sm:text-base otya-muted">Your account, security and connected Otya services at a glance.</p>
    </div>

    {(error || notice) && <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${error ? 'border-red-500/25 text-red-700 dark:text-red-200' : ''}`} style={!error ? { borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-card)' } : undefined}>{error || notice}</div>}

    <section id="overview" className="scroll-mt-24">
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <DashboardCard title="Otya identity" action={<Link href="#personal" className="text-xs font-bold otya-muted">Manage</Link>}>
          <div className="text-lg font-black break-words">{user.name || user.email?.split('@')[0] || user.otya_id || 'OTYA user'}</div>
          <div className="mt-1 text-sm otya-muted break-words">{user.email || 'No email added'}</div>
          <div className="mt-5"><Label>Otya ID</Label><div className="font-mono text-sm font-bold">{user.otya_id || 'Being assigned'}</div></div>
        </DashboardCard>
        <DashboardCard title="Security health" action={<Link href="#security" className="text-xs font-bold otya-muted">Review</Link>}>
          <div className="flex items-end gap-2"><div className="text-4xl font-black">{securityScore}</div><div className="pb-1 text-sm otya-muted">/ 100</div></div>
          <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ background: 'var(--cosmos-divider)' }}><div className="h-full rounded-full" style={{ width: `${securityScore}%`, background: 'var(--cosmos-primary)' }} /></div>
          <div className="mt-4 text-sm otya-muted">{twoFactor?.enabled ? 'Two-step verification is on.' : 'Turn on two-step verification for stronger protection.'}</div>
        </DashboardCard>
        <DashboardCard title="Devices & sessions" action={<Link href="#sessions" className="text-xs font-bold otya-muted">View all</Link>}>
          <div className="text-4xl font-black">{sessions.length}</div><div className="mt-1 text-sm otya-muted">recorded active sign-in{sessions.length === 1 ? '' : 's'}</div>
          <div className="mt-5 text-xs otya-muted">Last activity {sessions[0] ? formatDate(sessions[0].last_used_at) : 'not recorded yet'}</div>
        </DashboardCard>
        <DashboardCard title="Connected accounts" action={<Link href="#connected" className="text-xs font-bold otya-muted">Manage</Link>}>
          <StatusLine label="Google" on={Boolean(google)} /><StatusLine label="Telegram" on={Boolean(telegram)} /><StatusLine label="Verified phone" on={Boolean(user.phone_verified_at)} />
        </DashboardCard>
        <DashboardCard title="Storage & backup" action={<Link href="#storage" className="text-xs font-bold otya-muted">Open</Link>}>
          <div className="text-lg font-black">Cloud-ready</div><p className="mt-2 text-sm otya-muted">Otya Space will show cloud backup usage here when backup is enabled for your account.</p>
        </DashboardCard>
        <DashboardCard title="Recent activity" action={<Link href="#activity" className="text-xs font-bold otya-muted">Details</Link>}>
          <div className="text-sm font-bold">{sessions[0] ? 'Recent sign-in recorded' : 'No recent account activity'}</div><p className="mt-2 text-sm otya-muted">Security and account events will appear here without exposing private internal identifiers.</p>
        </DashboardCard>
      </div>
    </section>

    <ConsoleSection id="personal" title="My Otya" subtitle="Public identity and personal account settings.">
      <div className="grid sm:grid-cols-2 gap-3">
        <ReadOnly label="Otya ID" value={user.otya_id || 'Being assigned'} mono />
        <ReadOnly label="Primary email" value={user.email || 'No email added'} />
        <Field label="Name" value={name} onChange={setName} />
        <Field label="Recovery email" value={recoveryEmail} onChange={setRecoveryEmail} type="email" />
        <Field label="Country / region" value={country} onChange={setCountry} placeholder="UG" />
        <Field label="Language" value={locale} onChange={setLocale} placeholder="en-UG" />
        <Field label="Timezone" value={timezone} onChange={setTimezone} placeholder="Africa/Kampala" />
      </div>
      <button onClick={() => void saveProfile()} disabled={busy} className="cosmos-button mt-4 min-h-11 rounded-xl px-4 text-sm font-black">Save changes</button>
    </ConsoleSection>

    <ConsoleSection id="security" title="Security" subtitle="Verification and recovery controls for the same Otya account.">
      <Row title="Primary email" detail={!user.email ? 'No email added' : user.is_verified ? 'Verified' : 'Verification required'}>
        {user.email && !user.is_verified && <div className="mt-3 flex flex-wrap gap-2"><button onClick={() => void sendEmailCode()} disabled={busy} className="otya-quiet-button rounded-xl px-3 min-h-10 text-sm font-bold">Send code</button><input value={emailCode} onChange={e => setEmailCode(e.target.value)} placeholder="A1234" className="space-input max-w-[160px]"/><button onClick={() => void verifyEmail()} disabled={busy} className="cosmos-button rounded-xl px-3 min-h-10 text-sm font-bold">Verify</button></div>}
        {!user.email && <p className="mt-3 text-sm otya-muted">This account currently uses a connected identity such as Telegram. You can still use Otya Space and two-step verification without a primary email.</p>}
      </Row>
      <Row title="Two-step verification" detail={twoFactor?.enabled ? `On · ${twoFactor.recovery_codes_remaining} recovery codes remaining` : twoFactor?.available === false ? 'Unavailable on this deployment' : 'Off'}>
        {twoFactor?.available !== false && !twoFactor?.enabled && !twoFactorSetup && <button onClick={() => void startTwoFactor()} disabled={busy} className="mt-3 cosmos-button rounded-xl px-4 min-h-10 text-sm font-bold">Set up authenticator</button>}
        {twoFactorSetup && <div className="mt-4 space-y-3 rounded-2xl border p-4" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-card)' }}>
          <div><Label>Authenticator secret</Label><div className="mt-1 font-mono text-sm font-bold break-all">{twoFactorSetup.secret}</div></div>
          <p className="text-sm otya-muted">Add this secret to your authenticator app under Otya, then enter the current 6-digit code.</p>
          <div className="flex flex-wrap gap-2"><input value={twoFactorCode} onChange={event => setTwoFactorCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="123456" className="space-input max-w-[160px]"/><button onClick={() => void enableTwoFactor()} disabled={busy || twoFactorCode.length !== 6} className="cosmos-button rounded-xl px-4 min-h-10 text-sm font-bold">Enable</button><button onClick={() => { setTwoFactorSetup(null); setTwoFactorCode('') }} disabled={busy} className="otya-quiet-button rounded-xl px-4 min-h-10 text-sm font-bold">Cancel</button></div>
        </div>}
        {twoFactor?.enabled && <div className="mt-4 space-y-3"><p className="text-sm otya-muted">Enter a current authenticator code to make a sensitive change. Otya will sign your sessions out afterward.</p><div className="flex flex-wrap gap-2"><input value={twoFactorCode} onChange={event => setTwoFactorCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="123456" className="space-input max-w-[160px]"/><button onClick={() => void regenerateRecoveryCodes()} disabled={busy || twoFactorCode.length !== 6} className="otya-quiet-button rounded-xl px-4 min-h-10 text-sm font-bold">New recovery codes</button><button onClick={() => void disableTwoFactor()} disabled={busy || twoFactorCode.length !== 6} className="otya-quiet-button rounded-xl px-4 min-h-10 text-sm font-bold">Turn off</button></div></div>}
        {recoveryCodes.length > 0 && <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-card)' }}><div className="font-black">Save these recovery codes now</div><p className="mt-1 text-sm otya-muted">Each code works once. Keep them somewhere private outside this device.</p><div className="mt-3 grid sm:grid-cols-2 gap-2">{recoveryCodes.map(code => <div key={code} className="font-mono text-sm font-bold rounded-xl border px-3 py-2" style={{ borderColor: 'var(--cosmos-divider)' }}>{code}</div>)}</div><button onClick={() => window.location.replace('/sign-in?security=updated')} className="mt-4 cosmos-button rounded-xl px-4 min-h-10 text-sm font-bold">I saved them · Sign in again</button></div>}
      </Row>
      <Row title="Telegram" detail={telegram ? `Connected${telegram.provider_username ? ` · ${telegram.provider_username}` : ''}` : 'Not connected'}>{!telegram && <button onClick={() => void connectTelegram()} disabled={busy} className="mt-3 otya-quiet-button rounded-xl px-3 min-h-10 text-sm font-bold">Connect Telegram</button>}</Row>
    </ConsoleSection>

    <ConsoleSection id="sessions" title="Devices & sessions" subtitle="Review recorded Otya sign-ins and revoke access.">
      <div className="flex justify-end mb-3"><button onClick={() => void revokeAll()} disabled={busy || sessions.length === 0} className="otya-quiet-button rounded-xl px-3 min-h-10 text-sm font-bold">Sign out all</button></div>
      {sessions.length === 0 ? <Empty>No recorded sessions yet.</Empty> : <div className="space-y-2">{sessions.map(session => <div key={session.id} className="rounded-2xl border p-4 flex items-start justify-between gap-4" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-card)' }}><div className="min-w-0"><div className="text-sm font-bold truncate">{session.user_agent || 'Otya session'}</div><div className="mt-1 text-xs otya-muted">Last used {formatDate(session.last_used_at)}{session.ip ? ` · ${session.ip}` : ''}</div></div><button onClick={() => void revokeSession(session.id)} disabled={busy} className="shrink-0 text-sm font-bold">Sign out</button></div>)}</div>}
    </ConsoleSection>

    <ConsoleSection id="connected" title="Connected accounts" subtitle="External identities linked to this same Otya account.">
      <div className="grid sm:grid-cols-2 gap-3">{identities.length ? identities.map((identity, index) => <ReadOnly key={`${identity.provider}-${index}`} label={identity.provider} value={identity.provider_username || 'Connected'} />) : <Empty>No external accounts are connected yet.</Empty>}</div>
      {!telegram && <button onClick={() => void connectTelegram()} disabled={busy} className="mt-4 otya-quiet-button rounded-xl px-4 min-h-11 text-sm font-bold">Connect Telegram</button>}
    </ConsoleSection>

    <ConsoleSection id="storage" title="Storage & backup" subtitle="Cloud backup controls will live here without affecting local media."><Empty>Backup usage and restore controls will appear here when cloud backup is enabled.</Empty></ConsoleSection>
    <ConsoleSection id="activity" title="Activity" subtitle="Security and account events."><Empty>{sessions.length ? `Latest recorded session activity: ${formatDate(sessions[0].last_used_at)}.` : 'No recent account events are recorded yet.'}</Empty></ConsoleSection>
    <ConsoleSection id="notifications" title="Notifications" subtitle="Security alerts, product updates and account notices."><Empty>You’re up to date.</Empty></ConsoleSection>

    <ConsoleSection id="settings" title="Settings" subtitle="Preferences and consent for Otya Space.">
      <div className="grid sm:grid-cols-3 gap-3"><ReadOnly label="Terms" value={consent?.terms_accepted ? 'Accepted' : 'Not recorded'} /><ReadOnly label="Privacy" value={consent?.privacy_accepted ? 'Accepted' : 'Not recorded'} /><ReadOnly label="Marketing" value={consent?.marketing_consent ? 'Allowed' : 'Off'} /></div>
    </ConsoleSection>

    <style jsx global>{`.space-input{width:100%;min-height:44px;border:1px solid var(--cosmos-divider);background:var(--cosmos-card);color:var(--cosmos-text-primary);border-radius:12px;padding:10px 12px;outline:none}.space-input:focus{border-color:var(--cosmos-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--cosmos-primary) 12%,transparent)}`}</style>
  </main>
}

function DashboardCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return <article className="rounded-[22px] border p-5 min-h-[190px]" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-card)' }}><div className="flex items-center justify-between gap-3 mb-5"><h2 className="text-sm font-black">{title}</h2>{action}</div>{children}</article>
}
function ConsoleSection({ id, title, subtitle, children }: { id: string; title: string; subtitle: string; children: ReactNode }) {
  return <section id={id} className="scroll-mt-24 py-9 border-t mt-9" style={{ borderColor: 'var(--cosmos-divider)' }}><h2 className="text-2xl font-black tracking-[-.03em]">{title}</h2><p className="mt-1 mb-5 text-sm otya-muted">{subtitle}</p>{children}</section>
}
function Row({ title, detail, children }: { title: string; detail: string; children?: ReactNode }) { return <div className="py-5 border-t first:border-t-0" style={{ borderColor: 'var(--cosmos-divider)' }}><div className="font-bold">{title}</div><div className="mt-1 text-sm otya-muted">{detail}</div>{children}</div> }
function ReadOnly({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) { return <div className="rounded-2xl border p-4 min-w-0" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-card)' }}><Label>{label}</Label><div className={`mt-1 text-sm break-words ${mono ? 'font-mono font-bold' : 'font-semibold'}`}>{value || '—'}</div></div> }
function Field({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) { return <label><Label>{label}</Label><input className="space-input mt-1.5" value={value} onChange={event => onChange(event.target.value)} type={type} placeholder={placeholder} /></label> }
function Label({ children }: { children: ReactNode }) { return <div className="text-[10px] font-black uppercase tracking-[.15em] otya-muted">{children}</div> }
function StatusLine({ label, on }: { label: string; on: boolean }) { return <div className="flex items-center justify-between py-2 text-sm border-t first:border-t-0" style={{ borderColor: 'var(--cosmos-divider)' }}><span>{label}</span><span className="font-bold">{on ? 'Connected' : 'Not set'}</span></div> }
function Empty({ children }: { children: ReactNode }) { return <div className="rounded-2xl border p-5 text-sm otya-muted" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-card)' }}>{children}</div> }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString() }
