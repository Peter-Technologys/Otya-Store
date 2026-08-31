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

      const privilegedChild = pathname !== '/admin' && pathname !== '/admin/'
      if (privilegedChild && (response.ok !== true || state.authenticated !== true)) {
        window.location.replace('/admin')
        return
      }

      setChecking(false)
    }).catch(() => {
      if (cancelled) return
      const privilegedChild = pathname !== '/admin' && pathname !== '/admin/'
      if (privilegedChild) {
        window.location.replace('/admin')
        return
      }
      setChecking(false)
    })

    return () => { cancelled = true }
  }, [pathname])

  if (checking) {
    return <main className="min-h-screen grid place-items-center" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
      <div className="text-center">
        <OtyaBrandMark size={52} label="Checking Otya access" />
        <p className="mt-3 text-sm otya-muted">Checking your access…</p>
      </div>
    </main>
  }

  return children
}
