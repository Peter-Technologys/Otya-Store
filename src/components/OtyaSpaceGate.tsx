'use client'

import { ReactNode, useEffect, useState } from 'react'
import { OtyaBrandMark } from '@/components/OtyaBrandMark'
import { OtyaSpaceChrome } from '@/components/OtyaSpaceChrome'
import { getSpaceSession } from '@/lib/space-session'

const PUBLIC_OTYA_ID = /^2IS\d{8}$/i

function sectionForLegacyPath(pathname: string, hash: string) {
  if (pathname === '/' || pathname === '/space' || pathname === '/space/') return 'overview'
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
  if (pathname === '/account/sign-in-methods' || pathname === '/account/sign-in-methods/') return 'account/sign-in-methods'
  if (pathname === '/account/security' || pathname === '/account/security/') return 'security'
  if (pathname === '/account/devices' || pathname === '/account/devices/') return 'devices'
  if (pathname === '/account/providers' || pathname === '/account/providers/') return 'providers'
  if (pathname === '/account/storage' || pathname === '/account/storage/') return 'storage'
  if (pathname === '/account/activity' || pathname === '/account/activity/') return 'activity'
  if (pathname === '/account/notifications' || pathname === '/account/notifications/') return 'notifications'
  if (pathname === '/account/settings' || pathname === '/account/settings/') return 'settings'
  if (pathname === '/ask' || pathname === '/ask/') return 'next'
  if (pathname === '/telegram' || pathname === '/telegram/') return 'telegram'
  return null
}

function canonicalizeSpaceLocation(publicId: string) {
  if (!PUBLIC_OTYA_ID.test(publicId)) return

  const canonicalId = publicId.toUpperCase()
  const { pathname, hash, search } = window.location
  const parts = pathname.split('/').filter(Boolean)

  if (parts[0] === 'u') {
    const routeId = parts[1]?.toUpperCase()
    const section = parts.slice(2).join('/') || 'overview'
    if (routeId !== canonicalId) {
      window.history.replaceState(window.history.state, '', `/u/${canonicalId}/${section}${search}${hash}`)
    }
    return
  }

  const section = sectionForLegacyPath(pathname, hash)
  if (!section) return
  window.history.replaceState(window.history.state, '', `/u/${canonicalId}/${section}${search}`)
}

export function OtyaSpaceGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    void getSpaceSession().then(session => {
      if (cancelled) return
      if (session.ok !== true || session.authenticated !== true) {
        window.location.replace('/sign-in')
        return
      }

      const publicId = session.user?.otya_id?.trim()
      if (publicId) canonicalizeSpaceLocation(publicId)
      setReady(true)
    }).catch(() => {
      if (!cancelled) window.location.replace('/sign-in')
    })

    return () => { cancelled = true }
  }, [])

  if (!ready) {
    return <div className="min-h-screen grid place-items-center" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
      <div className="text-center px-6">
        <OtyaBrandMark size={46} />
        <div className="mt-4 mx-auto h-1 w-28 overflow-hidden rounded-full" style={{ background: 'var(--cosmos-divider)' }}>
          <div className="h-full w-1/2 animate-pulse rounded-full" style={{ background: 'var(--cosmos-primary)' }} />
        </div>
        <p className="mt-3 text-sm otya-muted">Opening Otya Space…</p>
      </div>
    </div>
  }

  return <OtyaSpaceChrome>{children}</OtyaSpaceChrome>
}
