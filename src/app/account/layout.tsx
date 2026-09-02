'use client'

import Link from 'next/link'
import { ReactNode } from 'react'
import { OtyaSpaceGate } from '@/components/OtyaSpaceGate'

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <OtyaSpaceGate>
    <div className="px-4 sm:px-7 lg:px-10 pt-5 max-w-[1180px] flex flex-wrap items-center gap-2">
      <Link href="/" className="inline-flex items-center min-h-10 rounded-xl border px-3.5 text-sm font-black" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-card)' }}>
        Space home
      </Link>
      <Link href="/account/sign-in-methods" className="inline-flex items-center min-h-10 rounded-xl border px-3.5 text-sm font-black" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-card)' }}>
        Sign-in methods
      </Link>
    </div>
    {children}
  </OtyaSpaceGate>
}
