'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { OtyaBrandMark } from '@/components/OtyaBrandMark'
import { getAdminSession } from '@/lib/admin_session_client'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false

    void getAdminSession().then(state => {
      if (cancelled) return

      const inAi = pathname === '/admin/ai' || pathname.startsWith('/admin/ai/')
      const atAdminHome = pathname === '/admin' || pathname === '/admin/'

      // Never render privileged admin surfaces unless the server positively
      // confirms an elevated admin session. UI state is not authorization.
      if (inAi && state.authenticated !== true) {
        window.location.replace('/admin')
        return
      }

      // Once elevated, the conversational command center is the admin home.
      if (atAdminHome && state.authenticated === true) {
        window.location.replace('/admin/ai')
        return
      }

      setChecking(false)
    }).catch(() => {
      if (cancelled) return
      const inAi = pathname === '/admin/ai' || pathname.startsWith('/admin/ai/')
      if (inAi) {
        // Deny by default if the authorization service cannot be reached.
        window.location.replace('/admin')
        return
      }
      // The Admin home must always settle to its sign-in/verification gate.
      // A network or service-binding fault must never leave a permanent spinner.
      setChecking(false)
    })

    return () => { cancelled = true }
  }, [pathname])

  if (checking) {
    return <main className="min-h-screen grid place-items-center" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
      <div className="text-center">
        <OtyaBrandMark size={52} thinking label="Checking Otya access" />
        <p className="mt-3 text-sm otya-muted">Checking your access…</p>
      </div>
    </main>
  }

  return children
}
