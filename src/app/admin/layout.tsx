'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { OtyaBrandMark } from '@/components/OtyaBrandMark'

type AdminState = {
  configured?: boolean
  authenticated?: boolean
  accountAdmin?: boolean
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false

    void fetch('/api/admin/session', {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    }).then(async response => {
      const state = await response.json().catch(() => ({})) as AdminState
      if (cancelled) return

      const inAi = pathname === '/admin/ai' || pathname.startsWith('/admin/ai/')
      const atAdminHome = pathname === '/admin' || pathname === '/admin/'

      // The AI command surface is privileged. If step-up MFA has not been
      // completed, send the account through the single admin gate first.
      if (inAi && state.authenticated !== true) {
        window.location.replace('/admin')
        return
      }

      // Once elevated, the conversational command center is the admin home.
      // Structured admin pages remain reachable from inside that interface.
      if (atAdminHome && state.authenticated === true) {
        window.location.replace('/admin/ai')
        return
      }

      setChecking(false)
    }).catch(() => {
      if (!cancelled) setChecking(false)
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
