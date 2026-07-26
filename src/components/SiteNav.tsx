'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { label: 'OTYA Player', href: '/otya-player' },
  { label: 'Services', href: '/services' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
]

export function SiteNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 border-b backdrop-blur-2xl" style={{ borderColor: 'var(--cosmos-divider)', background: 'rgba(2,2,8,0.95)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

        {/* Logo + brand name */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setOpen(false)}>
          <Image src="/web-app-manifest-192x192.png" alt="PeterSmart Technologies" width={32} height={32}
            className="rounded-xl" style={{ display: 'block', border: '1px solid var(--cosmos-divider)' }} priority />
          <span className="font-bold text-sm hidden sm:block" style={{ color: 'var(--cosmos-text-primary)' }}>PeterSmart Technologies</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ label, href }) => {
            const isActive = pathname?.startsWith(href)
            return (
              <Link key={href} href={href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-[rgba(123,97,255,0.08)]`}
                style={{
                  color: isActive ? 'var(--cosmos-primary)' : 'var(--cosmos-text-secondary)',
                  background: isActive ? 'rgba(123,97,255,0.1)' : 'transparent',
                }}>
                {label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          {/* OTYA Player logo button — logo only, no text */}
          <Link href="/download/otya-player"
            className="cosmos-button hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-transform"
            title="Download OTYA Player">
            <Image src="/played-icon.png" alt="Download OTYA Player" width={22} height={22}
              className="rounded-md" style={{ display: 'block' }} />
          </Link>

          {/* Hamburger */}
          <button onClick={() => setOpen(o => !o)}
            className="md:hidden flex flex-col justify-center items-center w-9 h-9 rounded-xl gap-1.5"
            style={{ background: 'var(--cosmos-card)', border: '1px solid var(--cosmos-divider)' }} aria-label="Menu">
            <span className={`block w-5 h-0.5 transition-all duration-300 origin-center ${
              open ? 'rotate-45 translate-y-2' : ''
            }`} style={{ background: 'var(--cosmos-text-primary)' }} />
            <span className={`block w-5 h-0.5 transition-all duration-300 ${
              open ? 'opacity-0 scale-x-0' : ''
            }`} style={{ background: 'var(--cosmos-text-primary)' }} />
            <span className={`block w-5 h-0.5 transition-all duration-300 origin-center ${
              open ? '-rotate-45 -translate-y-2' : ''
            }`} style={{ background: 'var(--cosmos-text-primary)' }} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t px-4 py-3 space-y-1"
          style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-app-bar)' }}>
          {NAV_LINKS.map(({ label, href }) => {
            const isActive = pathname?.startsWith(href)
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className="flex items-center h-10 px-3 rounded-xl text-sm font-medium transition-colors"
                style={{
                  color: isActive ? 'var(--cosmos-primary)' : 'var(--cosmos-text-primary)',
                  background: isActive ? 'rgba(123,97,255,0.1)' : 'transparent',
                }}>
                {label}
              </Link>
            )
          })}
          <Link href="/download/otya-player" onClick={() => setOpen(false)}
            className="cosmos-button flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold mt-2 transition-transform">
            <Image src="/played-icon.png" alt="" width={20} height={20} className="rounded-md" style={{ display: 'block' }} />
            Download OTYA Player
          </Link>
        </div>
      )}
    </nav>
  )
}