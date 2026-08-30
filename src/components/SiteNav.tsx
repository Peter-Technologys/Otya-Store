'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { OtyaBrandMark } from './OtyaBrandMark'

type Session = { authenticated?: boolean; user?: { name?: string; email?: string } }

export function SiteNav() {
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/account-session/session', { credentials: 'same-origin', cache: 'no-store' })
      .then(r => r.json())
      .then((data: Session) => { if (active) setSignedIn(data.authenticated === true) })
      .catch(() => undefined)
    return () => { active = false }
  }, [])

  return <header className="sticky top-0 z-50 border-b border-black/[.06] dark:border-white/[.08] bg-[color:var(--nav-bg)] backdrop-blur-2xl">
    <div className="otya-shell h-[64px] flex items-center gap-3">
      <Link href="/" className="inline-flex items-center gap-1.5 shrink-0" aria-label="Otya home">
        <OtyaBrandMark size={34} />
        <span className="font-black text-[19px] tracking-[-.045em] leading-none">tya</span>
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <Link href="/download/otya-player" className="hidden md:inline-flex min-h-10 items-center rounded-full px-4 text-[13px] font-extrabold otya-quiet-button">Get the app</Link>

        <Link
          href="/ask"
          aria-label="Open Otya"
          title="Otya"
          className="inline-flex min-h-11 min-w-11 items-center justify-center"
        >
          <OtyaBrandMark size={34} thinking />
        </Link>

        <Link
          href={signedIn ? '/account' : '/sign-in'}
          className="inline-flex min-h-10 items-center rounded-full px-4 text-[13px] font-extrabold cosmos-button"
        >
          {signedIn ? 'Account' : 'Sign in'}
        </Link>
      </div>
    </div>
  </header>
}
