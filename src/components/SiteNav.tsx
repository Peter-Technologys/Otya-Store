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
    <>
      <nav className="sticky top-0 z-50 border-b backdrop-blur-2xl" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.95)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0" onClick={() => setOpen(false)}>
            <Image src="/web-app-manifest-192x192.png" alt="PeterSmart" width={30} height={30} className="rounded-lg" style={{ display: 'block' }} priority />
            <div className="leading-tight">
              <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>PeterSmart</div>
              <div className="text-[10px]" style={{ color: 'var(--text-sub)' }}>Technologies</div>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, href }) => (
              <Link key={href} href={href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === href ? 'text-purple-600 bg-purple-50' : 'hover:bg-purple-50'
                }`}
                style={{ color: pathname === href ? undefined : 'var(--text-sub)' }}>
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Download CTA */}
            <Link href="/download/otya-player"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-semibold"
              style={{ background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)' }}>
              <Image src="/played-icon.png" alt="" width={16} height={16} className="rounded-sm" style={{ display: 'block' }} />
              Download
            </Link>

            {/* Hamburger */}
            <button onClick={() => setOpen(o => !o)}
              className="md:hidden flex flex-col justify-center items-center w-9 h-9 rounded-lg gap-1.5"
              style={{ background: 'var(--card)' }} aria-label="Menu">
              <span className={`block w-5 h-0.5 transition-all duration-300 ${open ? 'rotate-45 translate-y-2' : ''}`} style={{ background: 'var(--text)' }} />
              <span className={`block w-5 h-0.5 transition-all duration-300 ${open ? 'opacity-0' : ''}`} style={{ background: 'var(--text)' }} />
              <span className={`block w-5 h-0.5 transition-all duration-300 ${open ? '-rotate-45 -translate-y-2' : ''}`} style={{ background: 'var(--text)' }} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t px-4 py-3 space-y-1" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.98)' }}>
            {NAV_LINKS.map(({ label, href }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className="flex items-center h-10 px-3 rounded-xl text-sm font-medium"
                style={{ color: pathname === href ? '#7c3aed' : 'var(--text)', background: pathname === href ? 'var(--bg-secondary)' : 'transparent' }}>
                {label}
              </Link>
            ))}
            <Link href="/download/otya-player" onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 h-10 rounded-xl text-white text-sm font-semibold mt-2"
              style={{ background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)' }}>
              Download OTYA Player
            </Link>
          </div>
        )}
      </nav>
    </>
  )
}
