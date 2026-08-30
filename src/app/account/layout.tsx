'use client'

import { ReactNode, useEffect, useState } from 'react'

export default function AccountLayout({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetch('/api/account-session/session', {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    }).then(async response => {
      const data = await response.json().catch(() => ({})) as { authenticated?: boolean }
      if (cancelled) return
      if (!response.ok || data.authenticated !== true) {
        window.location.replace('/sign-in')
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
        <p className="text-sm opacity-60">Opening your Otya account…</p>
      </div>
    </div>
  }

  return children
}
