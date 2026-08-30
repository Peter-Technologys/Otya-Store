'use client'
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

const NAV_LINKS = [
  { label: 'Shop', href: 'https://shop.petersmartlink.com' },
  { label: 'Blog', href: 'https://blog.petersmartlink.com' },
  { label: 'Businesses', href: 'https://business.petersmartlink.com' },
  { label: 'Services', href: '/services' },
  { label: 'Apps', href: 'https://apps.petersmartlink.com' },
  { label: 'Contact', href: '/contact' },
]

export function SiteNav({ back }: { back?: { href: string; label: string } }) {
  const [open, setOpen] = React.useState(false)
  return (
    <nav
      className="sticky top-0 z-50 border-b backdrop-blur-xl"
      style={{ borderColor: 'var(--border)', background: 'var(--nav-bg)' }}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="PeterSmart Link home">
          <Image
            src="/web-app-manifest-192x192.png"
            alt="PeterSmart Link"
            width={36}
            height={36}
            className="rounded-xl object-cover"
            priority
          />
          <div>
            <div className="font-bold text-sm leading-tight" style={{ color: 'var(--text)' }}>PeterSmart Link</div>
            <div className="text-[11px] leading-tight tracking-wide" style={{ color: 'var(--text-sub)' }}>Apps • services • technology</div>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(l => (
            <a
              key={l.href}
              href={l.href}
              target={l.href.startsWith('http') ? '_blank' : undefined}
              rel={l.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/5"
              style={{ color: 'var(--text-sub)' }}
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {back && (
            <Link href={back.href} className="hidden sm:flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--text-sub)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              {back.label}
            </Link>
          )}
          <a
            href="https://t.me/OtyaPlayerBot"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-white/5"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            Telegram
          </a>
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border hover:bg-white/5 transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            aria-expanded={open}
            aria-controls="mobile-site-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              {open ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-site-menu" className="md:hidden border-t px-5 sm:px-6 py-4 space-y-1" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
          {NAV_LINKS.map(l => (
            <a
              key={l.href}
              href={l.href}
              target={l.href.startsWith('http') ? '_blank' : undefined}
              rel={l.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
              style={{ color: 'var(--text)' }}
            >
              {l.label}
            </a>
          ))}
          <a
            href="https://t.me/OtyaPlayerBot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 mt-2 px-4 py-2.5 rounded-xl border text-sm font-semibold"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            Telegram Support
          </a>
        </div>
      )}
    </nav>
  )
}

export function PageWrapper({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`min-h-screen ${className}`} style={{ background: 'var(--bg)', color: 'var(--text)' }}>{children}</div>
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border p-6 transition-all ${className}`} style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>{children}</div>
}

export function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-10">
      <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--text)' }}>{title}</h1>
      {subtitle && <p className="text-base" style={{ color: 'var(--text-sub)' }}>{subtitle}</p>}
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`rounded-2xl animate-pulse ${className}`} style={{ background: 'var(--card)' }} />
}
