'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { label: 'OTYA', href: '/otya-player' },
  { label: 'Ask OTYA', href: '/ask' },
  { label: 'Developers', href: '/developers' },
  { label: 'Docs', href: '/docs' },
  { label: 'Support', href: '/apps/otya-player/support' },
]

export function SiteNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return <nav className="sticky top-0 z-50 border-b backdrop-blur-xl" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--nav-bg)' }}>
    <div className="otya-shell h-14 flex items-center justify-between gap-4">
      <Link href="/" className="flex items-center gap-2 shrink-0" onClick={() => setOpen(false)}>
        <Image src="/web-app-manifest-192x192.png" alt="OTYA" width={28} height={28} className="rounded-lg" priority />
        <span className="font-semibold text-[15px] tracking-[-0.02em]" style={{ color: 'var(--cosmos-text-primary)' }}>OTYA</span>
      </Link>

      <div className="hidden md:flex items-center gap-5">
        {NAV_LINKS.map(({ label, href }) => {
          const active = pathname === href || pathname?.startsWith(`${href}/`)
          return <Link key={href} href={href} className="text-[13px] font-medium py-1" style={{ color: active ? 'var(--cosmos-text-primary)' : 'var(--cosmos-text-secondary)' }}>{label}</Link>
        })}
      </div>

      <div className="flex items-center gap-1.5">
        <Link href="/account" className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg text-[13px] font-medium" style={{ color: 'var(--cosmos-text-secondary)' }}>Account</Link>
        <Link href="/download/otya-player" className="cosmos-button hidden sm:inline-flex items-center px-3.5 py-1.5 rounded-lg text-[13px] font-semibold">Download</Link>
        <button onClick={() => setOpen(v => !v)} className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center" style={{ color: 'var(--cosmos-text-primary)' }} aria-label="Menu" aria-expanded={open}>
          <span className="text-lg leading-none">{open ? '×' : '☰'}</span>
        </button>
      </div>
    </div>

    {open && <div className="md:hidden border-t" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-app-bar)' }}>
      <div className="px-3 py-2">
        {NAV_LINKS.map(({ label, href }) => <Link key={href} href={href} onClick={() => setOpen(false)} className="block px-2 py-2.5 rounded-lg text-sm font-medium" style={{ color: 'var(--cosmos-text-primary)' }}>{label}</Link>)}
        <Link href="/account" onClick={() => setOpen(false)} className="block px-2 py-2.5 rounded-lg text-sm font-medium">Account</Link>
        <Link href="/download/otya-player" onClick={() => setOpen(false)} className="cosmos-button flex justify-center px-4 py-2.5 rounded-lg text-sm font-semibold mt-1">Download OTYA</Link>
      </div>
    </div>}
  </nav>
}
