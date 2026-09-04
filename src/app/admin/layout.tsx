'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { OtyaBrandMark } from '@/components/OtyaBrandMark'
import { getAdminSession } from '@/lib/admin_session_client'

function signInFor(pathname: string) {
  const next = pathname === '/admin' || pathname === '/admin/' ? '/admin' : pathname
  return `/sign-in?next=${encodeURIComponent(next || '/admin')}`
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false

    void getAdminSession().then(state => {
      if (cancelled) return

      const atAdminHome = pathname === '/admin' || pathname === '/admin/'

      // Admin is a role inside the signed-in Otya account. If fresh owner
      // verification is required, return to the normal Otya sign-in journey
      // rather than rendering a second Admin login/unlock experience here.
      if (state.authenticated !== true) {
        window.location.replace(signInFor(pathname))
        return
      }

      // Once owner verification is complete, the conversational command center
      // remains the current Admin home. Backend authorization still protects
      // every privileged API independently of this client-side routing.
      if (atAdminHome) {
        window.location.replace('/admin/ai')
        return
      }

      setChecking(false)
    }).catch(() => {
      if (cancelled) return
      // Fail closed and let the unified sign-in surface explain/retry the owner
      // verification state. Never expose privileged children on lookup failure.
      window.location.replace(signInFor(pathname))
    })

    return () => { cancelled = true }
  }, [pathname])

  if (checking) {
    return <main className="min-h-screen grid place-items-center" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
      <div className="text-center">
        <OtyaBrandMark size={52} thinking label="Checking Otya access" />
        <p className="mt-3 text-sm otya-muted">Checking your Otya account…</p>
      </div>
    </main>
  }

  return children
}
