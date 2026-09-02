'use client'

import { ReactNode, useEffect, useState } from 'react'
import { OtyaSpaceChrome } from '@/components/OtyaSpaceChrome'

type SessionState = {
  authenticated?: boolean
  user?: { otya_id?: string | null }
}

const PUBLIC_OTYA_ID = /^2IS\d{8}$/i

function sectionForLegacyPath(pathname: string, hash: string) {
  if (pathname === '/' || pathname === '/space' || pathname === '/space/') return 'overview'
  if (pathname === '/account/sign-in-methods' || pathname === '/account/sign-in-methods/') return 'account/sign-in-methods'
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
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    void fetch('/api/account-session/session', {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    }).then(async response => {
      const session = await response.json().catch(() => ({})) as SessionState
      if (cancelled) return
      if (!response.ok || session.authenticated !== true) {
        window.location.replace('/sign-in')
        return
      }

      const publicId = session.user?.otya_id?.trim()
      if (publicId && canonicalizeSpaceLocation(publicId)) return

      setReady(true)
    }).catch(() => {
      if (!cancelled) window.location.replace('/sign-in')
    })

    return () => { cancelled = true }
  }, [])

  if (!ready) {
    return <div className="min-h-screen grid place-items-center" style={{ background: 'radial-gradient(circle at 30% 20%,rgba(116,80,255,.22),transparent 35%),#0b0914', color: '#f7f4ff' }}>
      <div className="text-center">
        <div className="w-11 h-11 rounded-2xl mx-auto mb-4 animate-pulse" style={{ background: 'linear-gradient(145deg,#8269ff,#3ebcf4)' }} />
        <p className="text-sm opacity-60">Opening OTYA Space…</p>
      </div>
    </div>
  }

  return <OtyaSpaceChrome>{children}</OtyaSpaceChrome>
}
