'use client'

import Link from 'next/link'
import { ReactNode, useEffect, useState } from 'react'

const API = '/api/account-session'

type Section = 'account' | 'security' | 'devices' | 'storage' | 'activity' | 'notifications' | 'settings'
type User = {
  id?: string
  otya_id?: string | null
  email?: string | null
  name?: string | null
  is_verified?: boolean | number
  recovery_email?: string | null
  country_code?: string | null
  locale?: string | null
  timezone?: string | null
}
type Identity = { provider: string; provider_username?: string | null }
type Session = { id: string; created_at: string; last_used_at: string; ip?: string | null; user_agent?: string | null }
type TwoFactor = { enabled?: boolean; recovery_codes_remaining?: number; available?: boolean }
type Consent = { terms_accepted?: number; privacy_accepted?: number; marketing_consent?: number }
type Json = Record<string, unknown>

type AccountPayload = { user?: User; identities?: Identity[] }

const META: Record<Section, { eyebrow: string; title: string; subtitle: string }> = {
  account: { eyebrow: 'Account', title: 'My OTYA', subtitle: 'Your public OTYA identity and personal account details.' },
  security: { eyebrow: 'Account', title: 'Security', subtitle: 'Email verification, sign-in methods and two-step protection.' },
  devices: { eyebrow: 'Security', title: 'Devices & sessions', subtitle: 'Review active OTYA sessions and revoke access you no longer trust.' },
  storage: { eyebrow: 'OTYA services', title: 'Storage & backup', subtitle: 'Recovery services that are actually enabled for your account.' },
  activity: { eyebrow: 'Account', title: 'Activity', subtitle: 'Recent account and sign-in activity without exposing internal identifiers.' },
  notifications: { eyebrow: 'OTYA Space', title: 'Notifications', subtitle: 'Security, account and product notices that need your attention.' },
  settings: { eyebrow: 'OTYA Space', title: 'Settings', subtitle: 'Language, region, timezone and communication preferences.' },
}

async function accountFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  return fetch(`${API}/${path}`, { ...init, headers, credentials: 'same-origin', cache: 'no-store' })
}

export function OtyaSpaceAccountSection({ section }: { section: Section }) {
  const [user, setUser] = useState<User | null>(null)
  const [identities, setIdentities] = useState<Identity[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [twoFactor, setTwoFactor] = useState<TwoFactor | null>(null)
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
    let cancelled = false
    setLoading(true)
    setError('')

    const needsAccount = ['account', 'security', 'storage', 'settings'].includes(section)
    const needsSessions = ['devices', 'activity'].includes(section)
    const tasks: Promise<void>[] = []

    if (needsAccount) tasks.push(loadAccount(cancelledRef))
    if (needsSessions) tasks.push(loadSessions(cancelledRef))
    if (section === 'security') tasks.push(loadTwoFactor(cancelledRef))
    if (section === 'settings') tasks.push(loadConsent(cancelledRef))

    void Promise.all(tasks).catch(() => {
      if (!cancelled) setError('OTYA Space could not load this section. Refresh and try again.')
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })

    function cancelledRef() { return cancelled }
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section])

  async function loadAccount(cancelled: () => boolean = () => false) {
    const response = await accountFetch('account')
    if (!response.ok) throw new Error('account')
    const data = await response.json().catch(() => ({})) as AccountPayload
    if (cancelled()) return
    const next = data.user ?? null
    setUser(next)
    setIdentities(Array.isArray(data.identities) ? data.identities : [])
    setName(next?.name || '')
    setRecoveryEmail(next?.recovery_email || '')
    setCountry(next?.country_code || '')
    setLocale(next?.locale || navigator.language || '')
    setTimezone(next?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || '')
  }

  async function loadSessions(cancelled: () => boolean = () => false) {
    const response = await accountFetch('sessions')
    if (!response.ok) throw new Error('sessions')
    const data = await response.json().catch(() => ({})) as { sessions?: Session[] }
    if (!cancelled()) setSessions(Array.isArray(data.sessions) ? data.sessions : [])
  }

  async function loadTwoFactor(cancelled: () => boolean = () => false) {
    const response = await accountFetch('2fa/status')
    if (!response.ok) return
    const data = await response.json().catch(() => ({})) as TwoFactor
    if (!cancelled()) setTwoFactor(data)
  }

  async function loadConsent(cancelled: () => boolean = () => false) {
    const response = await accountFetch('consent')
    if (!response.ok) return
    const data = await response.json().catch(() => ({})) as { consent?: Consent }
    if (!cancelled()) setConsent(data.consent ?? null)
  }

  async function action(task: () => Promise<string>) {
    setBusy(true); setError(''); setNotice('')
    try { setNotice(await task()) } catch (cause) { setError((cause as Error).message) } finally { setBusy(false) }
  }

  async function saveProfile() {
    await action(async () => {
      const response = await accountFetch('account', {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim() || null,
          recovery_email: recoveryEmail.trim() || null,
          country_code: country.trim() || null,
          locale: locale.trim() || null,
          timezone: timezone.trim() || null,
        }),
      })
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
      return 'Verification code sent. Only the newest code will work.'
    })
  }

  async function verifyEmail() {
    if (!emailCode.trim()) return
    await action(async () => {
      const response = await accountFetch('verify-email', { method: 'POST', body: JSON.stringify({ otp: emailCode.trim().toUpperCase() }) })
      const data = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) throw new Error(data.error || 'Could not verify email.')
      setEmailCode('')
      await loadAccount()
      return 'Email verified.'
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

  const meta = META[section]

  return <main className="px-4 sm:px-7 lg:px-10 py-7 sm:py-9 max-w-[1100px]">
    <header className="mb-7">
      <div className="text-[11px] font-black uppercase tracking-[.16em] otya-muted">{meta.eyebrow}</div>
      <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-[-.045em]">{meta.title}</h1>
      <p className="mt-2 text-sm sm:text-base otya-muted">{meta.subtitle}</p>
    </header>

    {(error || notice) && <div className="mb-5 rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: error ? 'rgba(239,68,68,.3)' : 'var(--cosmos-divider)', background: 'var(--cosmos-card)' }}>{error || notice}</div>}

    {loading ? <SectionSkeleton /> : <>
      {section === 'account' && <AccountView user={user} name={name} setName={setName} recoveryEmail={recoveryEmail} setRecoveryEmail={setRecoveryEmail} country={country} setCountry={setCountry} locale={locale} setLocale={setLocale} timezone={timezone} setTimezone={setTimezone} busy={busy} save={() => void saveProfile()} />}
      {section === 'security' && <SecurityView user={user} twoFactor={twoFactor} identities={identities} emailCode={emailCode} setEmailCode={setEmailCode} busy={busy} sendCode={() => void sendEmailCode()} verify={() => void verifyEmail()} />}
      {section === 'devices' && <SessionsView sessions={sessions} busy={busy} revoke={id => void revokeSession(id)} revokeAll={() => void revokeAll()} />}
      {section === 'storage' && <StorageView identities={identities} />}
      {section === 'activity' && <ActivityView sessions={sessions} />}
      {section === 'notifications' && <NotificationsView />}
      {section === 'settings' && <SettingsView user={user} consent={consent} locale={locale} setLocale={setLocale} timezone={timezone} setTimezone={setTimezone} country={country} setCountry={setCountry} busy={busy} save={() => void saveProfile()} />}
    </>}

    <style jsx global>{`.space-input{width:100%;min-height:44px;border:1px solid var(--cosmos-divider);background:var(--cosmos-card);color:var(--cosmos-text-primary);border-radius:12px;padding:10px 12px;outline:none}.space-input:focus{border-color:var(--cosmos-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--cosmos-primary) 12%,transparent)}`}</style>
  </main>
}

function AccountView({ user, name, setName, recoveryEmail, setRecoveryEmail, country, setCountry, locale, setLocale, timezone, setTimezone, busy, save }: { user: User | null; name: string; setName:(v:string)=>void; recoveryEmail:string; setRecoveryEmail:(v:string)=>void; country:string; setCountry:(v:string)=>void; locale:string; setLocale:(v:string)=>void; timezone:string; setTimezone:(v:string)=>void; busy:boolean; save:()=>void }) {
  return <div className="space-y-5">
    <div className="grid sm:grid-cols-2 gap-3"><ReadOnly label="OTYA ID" value={user?.otya_id || 'Being assigned'} mono/><ReadOnly label="Primary email" value={user?.email || 'No email added'} /></div>
    <Panel title="Personal details"><div className="grid sm:grid-cols-2 gap-3"><Field label="Name" value={name} onChange={setName}/><Field label="Recovery email" value={recoveryEmail} onChange={setRecoveryEmail} type="email"/><Field label="Country / region" value={country} onChange={setCountry} placeholder="UG"/><Field label="Language" value={locale} onChange={setLocale} placeholder="en-UG"/><Field label="Timezone" value={timezone} onChange={setTimezone} placeholder="Africa/Kampala"/></div><button onClick={save} disabled={busy} className="cosmos-button mt-4 min-h-11 rounded-xl px-4 text-sm font-black">Save changes</button></Panel>
  </div>
}

function SecurityView({ user, twoFactor, identities, emailCode, setEmailCode, busy, sendCode, verify }: { user:User|null; twoFactor:TwoFactor|null; identities:Identity[]; emailCode:string; setEmailCode:(v:string)=>void; busy:boolean; sendCode:()=>void; verify:()=>void }) {
  const google = identities.some(item => item.provider === 'google')
  const telegram = identities.some(item => item.provider === 'telegram')
  return <div className="space-y-4">
    <Panel title="Primary email"><Status label={user?.email || 'No email added'} detail={!user?.email ? 'Add an email from Sign-in methods.' : user.is_verified ? 'Verified' : 'Verification required'} />{user?.email && !user.is_verified && <div className="mt-4 flex flex-wrap gap-2"><button onClick={sendCode} disabled={busy} className="otya-quiet-button rounded-xl px-3 min-h-10 text-sm font-bold">Send code</button><input className="space-input max-w-[160px]" value={emailCode} onChange={e=>setEmailCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,5))} placeholder="A1234"/><button onClick={verify} disabled={busy || emailCode.length !== 5} className="cosmos-button rounded-xl px-3 min-h-10 text-sm font-bold">Verify</button></div>}</Panel>
    <Panel title="Sign-in methods"><div className="grid sm:grid-cols-3 gap-3"><Status label="Email" detail={user?.email ? 'Connected' : 'Not added'}/><Status label="Google" detail={google ? 'Connected' : 'Not connected'}/><Status label="Telegram" detail={telegram ? 'Connected' : 'Not connected'}/></div><Link href="/account/sign-in-methods/" className="inline-flex mt-4 cosmos-button rounded-xl px-4 min-h-10 items-center text-sm font-bold">Manage sign-in methods</Link></Panel>
    <Panel title="Two-step verification"><Status label={twoFactor?.enabled ? 'On' : 'Off'} detail={twoFactor?.available === false ? 'Unavailable on this deployment' : twoFactor?.enabled ? `${twoFactor.recovery_codes_remaining ?? 0} recovery codes remaining` : 'Protect sensitive account actions with an authenticator app.'}/><p className="mt-3 text-sm otya-muted">Advanced authenticator setup remains available from the security controls while this page is being separated from the legacy combined console.</p></Panel>
  </div>
}

function SessionsView({ sessions, busy, revoke, revokeAll }: { sessions:Session[]; busy:boolean; revoke:(id:string)=>void; revokeAll:()=>void }) {
  return <Panel title="Active sessions" action={<button onClick={revokeAll} disabled={busy || sessions.length===0} className="text-sm font-bold">Sign out all</button>}>{sessions.length===0?<Empty>No recorded sessions yet.</Empty>:<div className="space-y-2">{sessions.map(session=><div key={session.id} className="rounded-2xl border p-4 flex items-start justify-between gap-4" style={{borderColor:'var(--cosmos-divider)',background:'var(--cosmos-card)'}}><div className="min-w-0"><div className="text-sm font-bold truncate">{session.user_agent || 'OTYA session'}</div><div className="mt-1 text-xs otya-muted">Last used {formatDate(session.last_used_at)}{session.ip?` · ${session.ip}`:''}</div></div><button onClick={()=>revoke(session.id)} disabled={busy} className="shrink-0 text-sm font-bold">Sign out</button></div>)}</div>}</Panel>
}

function StorageView({ identities }: { identities:Identity[] }) {
  const google = identities.some(item=>item.provider==='google')
  return <div className="grid md:grid-cols-2 gap-4"><Panel title="Playlist recovery"><div className="text-xl font-black">Google Drive app folder</div><p className="mt-2 text-sm leading-6 otya-muted">OTYA currently backs up playlist names and saved media references from the Android app. Media files and Private files stay on the device.</p><div className="mt-4 text-sm font-bold">Google {google?'connected':'not connected'}</div></Panel><Panel title="Cloud storage"><div className="text-xl font-black">Not pretending to be enabled</div><p className="mt-2 text-sm leading-6 otya-muted">OTYA Space will show account cloud usage here only when the backend actually stores that data. Local-only media is not presented as synced.</p></Panel></div>
}

function ActivityView({ sessions }: { sessions:Session[] }) { return <Panel title="Recent sign-ins">{sessions.length===0?<Empty>No recent account activity is recorded yet.</Empty>:<div className="space-y-3">{sessions.slice(0,20).map(session=><div key={session.id} className="border-b pb-3 last:border-0" style={{borderColor:'var(--cosmos-divider)'}}><div className="text-sm font-bold">{session.user_agent || 'OTYA session'}</div><div className="mt-1 text-xs otya-muted">{formatDate(session.last_used_at)}{session.ip?` · ${session.ip}`:''}</div></div>)}</div>}</Panel> }
function NotificationsView() { return <Panel title="Account notices"><Empty>You’re up to date. Security and product notices will appear here when there is something to review.</Empty></Panel> }
function SettingsView({ user, consent, locale, setLocale, timezone, setTimezone, country, setCountry, busy, save }: { user:User|null; consent:Consent|null; locale:string; setLocale:(v:string)=>void; timezone:string; setTimezone:(v:string)=>void; country:string; setCountry:(v:string)=>void; busy:boolean; save:()=>void }) { return <div className="space-y-4"><Panel title="Regional preferences"><div className="grid sm:grid-cols-3 gap-3"><Field label="Country / region" value={country || user?.country_code || ''} onChange={setCountry} placeholder="UG"/><Field label="Language" value={locale || user?.locale || ''} onChange={setLocale} placeholder="en-UG"/><Field label="Timezone" value={timezone || user?.timezone || ''} onChange={setTimezone} placeholder="Africa/Kampala"/></div><button onClick={save} disabled={busy} className="cosmos-button mt-4 min-h-11 rounded-xl px-4 text-sm font-black">Save preferences</button></Panel><Panel title="Consent"><div className="grid sm:grid-cols-3 gap-3"><ReadOnly label="Terms" value={consent?.terms_accepted?'Accepted':'Not recorded'}/><ReadOnly label="Privacy" value={consent?.privacy_accepted?'Accepted':'Not recorded'}/><ReadOnly label="Marketing" value={consent?.marketing_consent?'Allowed':'Off'}/></div></Panel></div> }

function Panel({ title, action, children }: { title:string; action?:ReactNode; children:ReactNode }) { return <section className="rounded-[22px] border p-5 sm:p-6" style={{borderColor:'var(--cosmos-divider)',background:'var(--cosmos-surface)'}}><div className="flex items-center justify-between gap-3 mb-5"><h2 className="text-lg font-black">{title}</h2>{action}</div>{children}</section> }
function Status({ label, detail }: { label:string; detail:string }) { return <div className="rounded-2xl border p-4" style={{borderColor:'var(--cosmos-divider)',background:'var(--cosmos-card)'}}><div className="font-bold">{label}</div><div className="mt-1 text-sm otya-muted">{detail}</div></div> }
function ReadOnly({label,value,mono=false}:{label:string;value:string;mono?:boolean}) { return <div className="rounded-2xl border p-4 min-w-0" style={{borderColor:'var(--cosmos-divider)',background:'var(--cosmos-card)'}}><div className="text-[11px] font-black uppercase tracking-[.12em] otya-muted">{label}</div><div className={`mt-1 text-sm break-words ${mono?'font-mono font-bold':'font-semibold'}`}>{value||'—'}</div></div> }
function Field({label,value,onChange,type='text',placeholder}:{label:string;value:string;onChange:(v:string)=>void;type?:string;placeholder?:string}) { return <label className="block"><span className="text-[11px] font-black uppercase tracking-[.12em] otya-muted">{label}</span><input className="space-input mt-1" value={value} onChange={e=>onChange(e.target.value)} type={type} placeholder={placeholder}/></label> }
function Empty({children}:{children:ReactNode}) { return <div className="rounded-2xl border border-dashed p-5 text-sm otya-muted" style={{borderColor:'var(--cosmos-divider)'}}>{children}</div> }
function SectionSkeleton() { return <div className="grid gap-3"><div className="h-28 rounded-[22px] animate-pulse" style={{background:'var(--cosmos-card)'}}/><div className="h-40 rounded-[22px] animate-pulse" style={{background:'var(--cosmos-card)'}}/></div> }
function formatDate(value:string) { const date=new Date(value); return Number.isNaN(date.getTime())?'Unknown time':date.toLocaleString() }
