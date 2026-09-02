'use client'

import { ReactNode, useEffect, useState } from 'react'
import { OtyaSpaceChrome, type SpaceUser } from '@/components/OtyaSpaceChrome'

type SessionState = {
  authenticated?: boolean
  user?: SpaceUser
}

const PUBLIC_OTYA_ID = /^2IS\d{8}$/i

function sectionForLegacyPath(pathname: string, hash: string) {
  if (pathname === '/' || pathname === '/space' || pathname === '/space/') return 'overview'
  if (pathname === '/account/sign-in-methods' || pathname === '/account/sign-in-methods/') return 'account/sign-in-methods'
  if (pathname === '/account/security' || pathname === '/account/security/') return 'security'
  if (pathname === '/account/devices' || pathname === '/account/devices/') return 'devices'
  if (pathname === '/account/storage' || pathname === '/account/storage/') return 'storage'
  if (pathname === '/account/activity' || pathname === '/account/activity/') return 'activity'
  if (pathname === '/account/notifications' || pathname === '/account/notifications/') return 'notifications'
  if (pathname === '/account/settings' || pathname === '/account/settings/') return 'settings'
  if (pathname === '/account' || pathname === '/account/') {
    if (hash === '#security') return 'security'
    if (hash === '#sessions') return 'devices'
    if (hash === '#connected') return 'providers'
    if (hash === '#storage') return 'storage'
    if (hash === '#activity') return 'activity'
    if (hash === '#notifications') return 'notifications'
    if (hash === '#settings') return 'settings'
    return 'account'
  }
  if (pathname === '/account/overview' || pathname === '/account/overview/') return 'account'
  return null
}

function canonicalizeSpaceLocation(publicId: string) {
  if (!PUBLIC_OTYA_ID.test(publicId)) return false

  const canonicalId = publicId.toUpperCase()
  const { pathname, hash, search } = window.location
  const parts = pathname.split('/').filter(Boolean)

  if (parts[0] === 'u') {
    const routeId = parts[1]?.toUpperCase()
    const section = parts.slice(2).join('/') || 'overview'
    if (routeId !== canonicalId) {
      window.location.replace(`/u/${canonicalId}/${section}${search}${hash}`)
      return true
    }
    return false
  }

  const section = sectionForLegacyPath(pathname, hash)
  if (!section) return false
  window.location.replace(`/u/${canonicalId}/${section}${search}${hash}`)
  return true
}

export function OtyaSpaceGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SpaceUser | null>(null)

  useEffect(() => {
    let cancelled = false

    void fetch('/api/account-session/session', {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    }).then(async response => {
      const session = await response.json().catch(() => ({})) as SessionState
      if (cancelled) return
      if (!response.ok || session.authenticated !== true || !session.user) {
        window.location.replace('/sign-in')
        return
      }

      const publicId = session.user.otya_id?.trim()
      if (publicId && canonicalizeSpaceLocation(publicId)) return

      setUser(session.user)
    }).catch(() => {
      if (!cancelled) window.location.replace('/sign-in')
    })

    return () => { cancelled = true }
  }, [])

  if (!user) {
    return <div className="min-h-screen" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
      <div className="h-16 border-b animate-pulse" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-surface)' }} />
      <div className="lg:grid lg:grid-cols-[270px_minmax(0,1fr)]">
        <div className="hidden lg:block min-h-[calc(100vh-64px)] border-r" style={{ borderColor: 'var(--cosmos-divider)' }} />
        <div className="px-4 sm:px-7 lg:px-10 py-8 max-w-[1100px]">
          <div className="h-5 w-28 rounded-lg animate-pulse" style={{ background: 'var(--cosmos-card)' }} />
          <div className="mt-3 h-10 w-64 max-w-full rounded-xl animate-pulse" style={{ background: 'var(--cosmos-card)' }} />
          <div className="mt-7 grid md:grid-cols-2 gap-4">
            <div className="h-40 rounded-[22px] animate-pulse" style={{ background: 'var(--cosmos-card)' }} />
            <div className="h-40 rounded-[22px] animate-pulse" style={{ background: 'var(--cosmos-card)' }} />
          </div>
        </div>
      </div>
    </div>
  }

  return <OtyaSpaceChrome user={user}>{children}</OtyaSpaceChrome>
}
