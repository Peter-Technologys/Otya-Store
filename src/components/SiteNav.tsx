'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { label: 'Products', href: '/otya-player' },
  { label: 'Services', href: '/services' },
  { label: 'About', href: '/about' },
  { label: 'Support', href: '/apps/otya-player/support' },
  { label: 'Contact', href: '/contact' },
]

export function SiteNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 border-b backdrop-blur-2xl" style={{ borderColor: 'var(--cosmos-divider)', background: 'rgba(5,5,10,0.88)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setOpen(false)}>
          <Image src="/web-app-manifest-192x192.png" alt="PeterSmart Link" width={34} height={34} className="rounded-xl" priority />
          <span className="font-bold text-sm sm:text-base" style={{ color: 'var(--cosmos-text-primary)' }}>
            PeterSmart <span style={{ color: 'var(--cosmos-primary)' }}>Link</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ label, href }) => {
            const active = href === '/' ? pathname === '/' : pathname?.startsWith(href)
            return <Link key={href} href={href} className="px-3 py-2 rounded-lg text-sm font-medium" style={{ color: active ? 'var(--cosmos-text-primary)' : 'var(--cosmos-text-secondary)', background: active ? 'rgba(139,92,246,.10)' : 'transparent' }}>{label}</Link>
          })}
        </div>

        <div className="flex items-center gap-2">
          <Link href="/download/otya-player" className="cosmos-button hidden sm:inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold">Download OTYA</Link>
          <button onClick={() => setOpen(v => !v)} className="md:hidden w-10 h-10 rounded-xl border flex items-center justify-center" style={{ borderColor: 'var(--cosmos-divider)', color: 'var(--cosmos-text-primary)' }} aria-label="Menu">
            <span className="text-xl leading-none">{open ? '×' : '☰'}</span>
          </button>
        </div>
      </div>

      {open && <div className="md:hidden border-t px-4 py-3 space-y-1" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-app-bar)' }}>
        {NAV_LINKS.map(({ label, href }) => <Link key={href} href={href} onClick={() => setOpen(false)} className="block px-3 py-3 rounded-xl text-sm font-medium" style={{ color: 'var(--cosmos-text-primary)' }}>{label}</Link>)}
        <Link href="/download/otya-player" onClick={() => setOpen(false)} className="cosmos-button flex justify-center px-4 py-3 rounded-xl text-sm font-semibold mt-2">Download OTYA</Link>
      </div>}
    </nav>
  )
}
