'use client'

import { ReactNode, useEffect, useState } from 'react'
import { OtyaSpaceChrome } from '@/components/OtyaSpaceChrome'

type SessionState = { authenticated?: boolean }
type AdminState = { accountAdmin?: boolean; authenticated?: boolean }

export default function AccountLayout({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    void Promise.all([
      fetch('/api/account-session/session', {
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      }),
      fetch('/api/admin/session', {
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      }).catch(() => null),
    ]).then(async ([sessionResponse, adminResponse]) => {
      const session = await sessionResponse.json().catch(() => ({})) as SessionState
      const admin = adminResponse
        ? await adminResponse.json().catch(() => ({})) as AdminState
        : {}

      if (cancelled) return
      if (!sessionResponse.ok || session.authenticated !== true) {
        window.location.replace('/sign-in')
        return
      }

      // An allowlisted administrator should never be dropped into the ordinary
      // user workspace by accident. Route them into the privileged step-up
      // flow; /admin itself still requires fresh admin MFA before any power is
      // granted. This is UX routing only, never the security boundary.
      if (admin.accountAdmin === true || admin.authenticated === true) {
        window.location.replace('/admin')
        return
      }

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
        <p className="text-sm opacity-60">Opening Otya Space…</p>
      </div>
    </div>
  }

  return <OtyaSpaceChrome>{children}</OtyaSpaceChrome>
}
