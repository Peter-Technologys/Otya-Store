'use client'

import Link from 'next/link'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { SpaceCard, SpaceMessage, SpacePage } from '@/components/SpaceSectionUi'
import { getSpaceSession, type SpaceSession, type SpaceUser } from '@/lib/space-session'

type Session = { id: string; last_used_at?: string }
type TwoFactor = { enabled?: boolean }
type BackupStatus = { has_backup?: boolean; last_backup_at?: string | null }

async function accountFetch(path: string) {
  return fetch(`/api/account-session/${path}`, {
    cache: 'no-store',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  })
}

export default function SpaceHomePage() {
  const [session, setSession] = useState<SpaceSession | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [twoFactor, setTwoFactor] = useState<TwoFactor>({})
  const [backup, setBackup] = useState<BackupStatus>({})
  const [loadingExtras, setLoadingExtras] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    void getSpaceSession().then(value => {
      if (!cancelled) setSession(value)
    }).catch(() => {
      if (!cancelled) setError('Otya Space could not load your account summary. Your account has not been changed.')
    })

    void Promise.all([
      accountFetch('sessions').catch(() => null),
      accountFetch('2fa/status').catch(() => null),
      accountFetch('backup?status=1').catch(() => null),
    ]).then(async ([sessionsResponse, twoFactorResponse, backupResponse]) => {
      const sessionData = sessionsResponse?.ok
        ? await sessionsResponse.json().catch(() => ({})) as { sessions?: Session[] }
        : {}
      const twoFactorData = twoFactorResponse?.ok
        ? await twoFactorResponse.json().catch(() => ({})) as TwoFactor
        : {}
      const backupData = backupResponse?.ok
        ? await backupResponse.json().catch(() => ({})) as BackupStatus
        : {}
      if (cancelled) return
      setSessions(Array.isArray(sessionData.sessions) ? sessionData.sessions : [])
      setTwoFactor(twoFactorData)
      setBackup(backupData)
    }).finally(() => {
      if (!cancelled) setLoadingExtras(false)
    })

    return () => { cancelled = true }
  }, [])

  const user = session?.user as SpaceUser | undefined
  const identities = Array.isArray(session?.identities) ? session!.identities! : []
  const products = Array.isArray(session?.products) ? session!.products! : []
  const google = identities.find(identity => identity.provider === 'google')
  const telegram = identities.find(identity => identity.provider === 'telegram')
  const connectedCount = [Boolean(user?.email), Boolean(google), Boolean(telegram)].filter(Boolean).length
  const displayName = user?.name?.trim() || user?.email?.split('@')[0] || user?.otya_id || 'Otya user'
  const lastActivity = useMemo(() => sessions[0]?.last_used_at ? formatDate(sessions[0].last_used_at) : 'No recent session activity', [sessions])

  return <SpacePage title={`Welcome, ${displayName}`} subtitle="Your signed-in Otya environment. Each major area opens as its own console page while sharing one Otya ID and one secure session.">
    {error && <SpaceMessage kind="error">{error}</SpaceMessage>}

    <section className="relative overflow-hidden rounded-[28px] border p-6 sm:p-8 mb-6" style={{ borderColor: 'var(--cosmos-divider)', background: 'linear-gradient(135deg,color-mix(in srgb,var(--cosmos-primary) 13%,var(--cosmos-card)),var(--cosmos-card) 58%)' }}>
      <div className="max-w-3xl">
        <div className="text-[11px] font-black uppercase tracking-[.18em] otya-muted">Otya Space · v1.0.0</div>
        <h2 className="mt-3 text-2xl sm:text-4xl font-black tracking-[-.045em]">One account. Separate areas. Less waiting.</h2>
        <p className="mt-3 text-sm sm:text-base leading-7 otya-muted">Account, Security, Devices, Activity, Storage, Notifications and Preferences now have their own pages instead of competing on one long screen.</p>
        {user?.otya_id && <div className="mt-4 inline-flex rounded-xl border px-3 py-2 font-mono text-xs font-bold" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-card)' }}>Otya ID · {user.otya_id}</div>}
      </div>
    </section>

    <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      <DashboardLink href="/account/" title="Account" eyebrow="Identity" detail={user?.email || user?.otya_id || 'Your Otya account'}>
        Manage your name, recovery email and public Otya identity details.
      </DashboardLink>

      <DashboardLink href="/account/security/" title="Security" eyebrow="Protection" detail={loadingExtras ? 'Checking…' : twoFactor.enabled ? 'Two-step verification on' : 'Review security'}>
        Email verification, authenticator setup and recovery codes.
      </DashboardLink>

      <DashboardLink href="/account/devices/" title="Devices & sessions" eyebrow="Access" detail={loadingExtras ? 'Checking…' : `${sessions.length} active session${sessions.length === 1 ? '' : 's'}`}>
        Review and revoke recorded sign-ins from browsers and devices.
      </DashboardLink>

      <DashboardLink href="/account/sign-in-methods/" title="Sign-in methods" eyebrow="One Otya ID" detail={`${connectedCount} connected method${connectedCount === 1 ? '' : 's'}`}>
        Email, Google and Telegram can all belong to this same account.
      </DashboardLink>

      <DashboardLink href="/account/activity/" title="Activity" eyebrow="Recent sign-ins" detail={lastActivity}>
        See recorded account activity without mixing it with session controls.
      </DashboardLink>

      <DashboardLink href="/account/storage/" title="Storage & recovery" eyebrow="Google Drive" detail={loadingExtras ? 'Checking…' : backup.has_backup ? 'Recovery backup recorded' : 'No backup recorded'}>
        View safe recovery status. Backup and restore actions remain explicit in the Android app.
      </DashboardLink>

      <DashboardLink href="/account/notifications/" title="Notifications" eyebrow="Communication" detail="Security + optional product news">
        Keep necessary security messages separate from optional marketing preferences.
      </DashboardLink>

      <DashboardLink href="/account/settings/" title="Preferences" eyebrow="Account settings" detail="Region, language and privacy records">
        Manage account preferences without changing your Otya ID.
      </DashboardLink>

      <DashboardLink href="/ask/" title="Next" eyebrow="Otya assistant" detail="Open Next">
        Ask questions or get Otya help from the same signed-in environment.
      </DashboardLink>

      <DashboardLink href="/telegram/" title="Telegram" eyebrow="Connected service" detail={telegram ? 'Connected' : 'Available to connect'}>
        Use the Telegram Mini App and linked identity without creating a second Otya user.
      </DashboardLink>

      <SpaceCard title="Otya products" subtitle="Product records associated with this account.">
        <div className="text-4xl font-black">{products.length}</div>
        <p className="mt-1 text-sm otya-muted">product record{products.length === 1 ? '' : 's'} associated with this Otya ID</p>
      </SpaceCard>

      <SpaceCard title="Privacy & help" subtitle="Public product policies and support resources.">
        <div className="flex flex-col gap-2 text-sm font-black">
          <a href="https://petersmartlink.com/privacy">Privacy Policy</a>
          <a href="https://petersmartlink.com/terms">Terms of Service</a>
          <a href="https://docs.petersmartlink.com">Otya Help & Docs</a>
        </div>
      </SpaceCard>
    </section>
  </SpacePage>
}

function DashboardLink({ href, title, eyebrow, detail, children }: { href: string; title: string; eyebrow: string; detail: string; children: ReactNode }) {
  return <Link href={href} className="group rounded-[22px] border p-5 min-h-[210px] transition-transform hover:-translate-y-0.5" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-card)' }}>
    <div className="text-[10px] font-black uppercase tracking-[.15em] otya-muted">{eyebrow}</div>
    <h2 className="mt-1 text-lg font-black tracking-[-.025em]">{title}</h2>
    <div className="mt-5 text-sm font-black">{detail}</div>
    <p className="mt-2 text-sm leading-6 otya-muted">{children}</p>
    <div className="mt-4 text-xs font-black text-[color:var(--cosmos-primary)]">Open →</div>
  </Link>
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recent activity recorded'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}
