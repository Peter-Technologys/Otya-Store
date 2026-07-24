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
    <nav className="sticky top-0 z-50 border-b backdrop-blur-2xl" style={{ borderColor: 'var(--border)', background: 'var(--nav-bg, rgba(255,255,255,0.95))' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

        {/* Logo + brand name */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setOpen(false)}>
          <Image src="/web-app-manifest-192x192.png" alt="PeterSmart Technologies" width={32} height={32}
            className="rounded-xl" style={{ display: 'block' }} priority />
          <span className="font-bold text-sm hidden sm:block" style={{ color: 'var(--text)' }}>PeterSmart Technologies</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ label, href }) => (
            <Link key={href} href={href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname?.startsWith(href) ? 'text-purple-600 bg-purple-50' : 'hover:bg-purple-50'
              }`}
              style={{ color: pathname?.startsWith(href) ? undefined : 'var(--text-sub)' }}>
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* OTYA Player logo button — logo only, no text */}
          <Link href="/download/otya-player"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-transform hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)' }}
            title="Download OTYA Player">
            <Image src="/played-icon.png" alt="Download OTYA Player" width={22} height={22}
              className="rounded-md" style={{ display: 'block' }} />
          </Link>

          {/* Hamburger */}
          <button onClick={() => setOpen(o => !o)}
            className="md:hidden flex flex-col justify-center items-center w-9 h-9 rounded-xl gap-1.5"
            style={{ background: 'var(--card)' }} aria-label="Menu">
            <span className={`block w-5 h-0.5 transition-all duration-300 origin-center ${
              open ? 'rotate-45 translate-y-2' : ''
            }`} style={{ background: 'var(--text)' }} />
            <span className={`block w-5 h-0.5 transition-all duration-300 ${
              open ? 'opacity-0 scale-x-0' : ''
            }`} style={{ background: 'var(--text)' }} />
            <span className={`block w-5 h-0.5 transition-all duration-300 origin-center ${
              open ? '-rotate-45 -translate-y-2' : ''
            }`} style={{ background: 'var(--text)' }} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t px-4 py-3 space-y-1"
          style={{ borderColor: 'var(--border)', background: 'var(--nav-bg, rgba(255,255,255,0.98))' }}>
          {NAV_LINKS.map(({ label, href }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className="flex items-center h-10 px-3 rounded-xl text-sm font-medium transition-colors"
              style={{
                color: pathname?.startsWith(href) ? 'var(--purple)' : 'var(--text)',
                background: pathname?.startsWith(href) ? 'var(--bg-secondary)' : 'transparent',
              }}>
              {label}
            </Link>
          ))}
          <Link href="/download/otya-player" onClick={() => setOpen(false)}
            className="flex items-center gap-2 h-11 px-4 rounded-xl text-white text-sm font-semibold mt-2 transition-transform hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)' }}>
            <Image src="/played-icon.png" alt="" width={20} height={20} className="rounded-md" style={{ display: 'block' }} />
            Download OTYA Player
          </Link>
        </div>
      )}
    </nav>
  )
}
