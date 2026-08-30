'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Music', href: '/music' },
  { label: 'Otya', href: '/ask' },
]

export function SiteNav() {
  const pathname = usePathname()
  const active = (href: string) => href === '/' ? pathname === '/' : pathname === href || pathname?.startsWith(`${href}/`)

  return <header className="sticky top-0 z-50 border-b border-black/[.06] dark:border-white/[.08] bg-[color:var(--nav-bg)] backdrop-blur-2xl">
    <div className="otya-shell h-[64px] flex items-center gap-3">
      <Link href="/" className="inline-flex items-center gap-1.5 shrink-0" aria-label="Otya home">
        <Image src="/otya-icon.svg" alt="" width={34} height={34} priority className="w-[34px] h-[34px] object-contain shrink-0" />
        <span className="font-black text-[19px] tracking-[-.045em] leading-none">tya</span>
      </Link>

      <nav className="hidden sm:flex items-center gap-1 ml-7" aria-label="Primary navigation">
        {LINKS.map(({ label, href }) => <Link key={href} href={href}
          className="rounded-full px-3.5 py-2 text-[13px] font-bold"
          style={{
            color: active(href) ? 'var(--cosmos-text-primary)' : 'var(--cosmos-text-secondary)',
            background: active(href) ? 'color-mix(in srgb,var(--cosmos-primary) 10%,transparent)' : 'transparent',
          }}>
          {label}
        </Link>)}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <Link href="/download/otya-player" className="hidden md:inline-flex min-h-10 items-center rounded-full px-4 text-[13px] font-extrabold otya-quiet-button">Get the app</Link>
        <Link href="/sign-in" className="inline-flex min-h-10 items-center rounded-full px-4 text-[13px] font-extrabold cosmos-button">Sign in</Link>
      </div>
    </div>

    <nav className="sm:hidden border-t border-black/[.05] dark:border-white/[.06]" aria-label="Mobile navigation">
      <div className="otya-shell h-11 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {LINKS.map(({ label, href }) => <Link key={href} href={href}
          className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold"
          style={{
            color: active(href) ? 'var(--cosmos-text-primary)' : 'var(--cosmos-text-secondary)',
            background: active(href) ? 'color-mix(in srgb,var(--cosmos-primary) 10%,transparent)' : 'transparent',
          }}>
          {label}
        </Link>)}
        <Link href="/download/otya-player" className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold" style={{ color:'var(--cosmos-text-secondary)' }}>Get app</Link>
      </div>
    </nav>
  </header>
}
