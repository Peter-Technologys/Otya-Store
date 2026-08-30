'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { label: 'Music', href: '/music' },
  { label: 'Ask OTYA', href: '/ask' },
  { label: 'Get OTYA', href: '/download/otya-player' },
]

export function SiteNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return <nav className="sticky top-0 z-50 border-b backdrop-blur-xl" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--nav-bg)' }}>
    <div className="otya-shell h-14 flex items-center justify-between gap-4">
      <Link href="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setOpen(false)} aria-label="OTYA home">
        <span className="w-9 h-9 grid place-items-center shrink-0">
          <Image src="/otya-icon.svg" alt="" width={36} height={36} priority className="w-full h-full object-contain" />
        </span>
        <span className="font-black text-[16px] tracking-[-0.03em]" style={{ color: 'var(--cosmos-text-primary)' }}>OTYA</span>
      </Link>

      <div className="hidden md:flex items-center gap-6">
        {NAV_LINKS.map(({ label, href }) => {
          const active = pathname === href || pathname?.startsWith(`${href}/`)
          return <Link key={href} href={href} className="text-[13px] font-semibold py-1" style={{ color: active ? 'var(--cosmos-text-primary)' : 'var(--cosmos-text-secondary)' }}>{label}</Link>
        })}
      </div>

      <div className="flex items-center gap-1.5">
        <Link href="/account" className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg text-[13px] font-medium" style={{ color: 'var(--cosmos-text-secondary)' }}>Account</Link>
        <button onClick={() => setOpen(v => !v)} className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center" style={{ color: 'var(--cosmos-text-primary)' }} aria-label="Menu" aria-expanded={open}>
          <span className="text-lg leading-none">{open ? '×' : '☰'}</span>
        </button>
      </div>
    </div>

    {open && <div className="md:hidden border-t" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-app-bar)' }}>
      <div className="px-3 py-2">
        {NAV_LINKS.map(({ label, href }) => <Link key={href} href={href} onClick={() => setOpen(false)} className="block px-2 py-3 rounded-lg text-sm font-semibold" style={{ color: 'var(--cosmos-text-primary)' }}>{label}</Link>)}
        <Link href="/account" onClick={() => setOpen(false)} className="block px-2 py-3 rounded-lg text-sm font-semibold">Account</Link>
      </div>
    </div>}
  </nav>
}
