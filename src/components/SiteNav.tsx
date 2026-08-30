'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const DESKTOP_LINKS = [
  { label: 'Music', href: '/music' },
  { label: 'Ask OTYA', href: '/ask' },
  { label: 'Get OTYA', href: '/download/otya-player' },
]

const MOBILE_LINKS = [
  { label: 'Home', href: '/', icon: '⌂' },
  { label: 'Music', href: '/music', icon: '♪' },
  { label: 'Ask', href: '/ask', icon: '✦' },
  { label: 'Account', href: '/sign-in', icon: '◉' },
]

function isActive(pathname: string | null, href: string) {
  if (href === '/') return pathname === '/'
  if (href === '/sign-in') return pathname === '/sign-in' || pathname?.startsWith('/account')
  return pathname === href || pathname?.startsWith(`${href}/`)
}

export function SiteNav() {
  const pathname = usePathname()

  return <>
    <nav className="sticky top-0 z-50 border-b backdrop-blur-xl" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--nav-bg)' }}>
      <div className="otya-shell h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="OTYA home">
          <span className="w-9 h-9 grid place-items-center shrink-0">
            <Image src="/otya-icon.svg" alt="" width={36} height={36} priority className="w-full h-full object-contain" />
          </span>
          <span className="font-black text-[16px] tracking-[-0.03em]" style={{ color: 'var(--cosmos-text-primary)' }}>OTYA</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {DESKTOP_LINKS.map(({ label, href }) => {
            const active = isActive(pathname, href)
            return <Link key={href} href={href} className="text-[13px] font-semibold py-1" aria-current={active ? 'page' : undefined} style={{ color: active ? 'var(--cosmos-text-primary)' : 'var(--cosmos-text-secondary)' }}>{label}</Link>
          })}
        </div>

        <div className="flex items-center gap-2">
          <Link href="/download/otya-player" className="md:hidden inline-flex items-center min-h-9 px-3 rounded-full text-xs font-bold otya-quiet-button">Get app</Link>
          <Link href="/sign-in" className="hidden md:inline-flex items-center px-3 py-1.5 rounded-lg text-[13px] font-medium" style={{ color: 'var(--cosmos-text-secondary)' }}>Account</Link>
        </div>
      </div>
    </nav>

    <nav className="otya-mobile-dock md:hidden" aria-label="Primary navigation">
      <div className="otya-mobile-dock-inner">
        {MOBILE_LINKS.map(({ label, href, icon }) => {
          const active = isActive(pathname, href)
          return <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`otya-dock-item ${active ? 'is-active' : ''}`}>
            <span className="otya-dock-icon" aria-hidden="true">{icon}</span>
            <span>{label}</span>
          </Link>
        })}
      </div>
    </nav>
  </>
}
