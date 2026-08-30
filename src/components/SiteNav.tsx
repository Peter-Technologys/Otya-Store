'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const DESKTOP_LINKS = [
  { label: 'Music', href: '/music' },
  { label: 'Ask Otya', href: '/ask' },
  { label: 'Get Otya', href: '/download/otya-player' },
]

const MOBILE_LINKS = [
  { label: 'Home', href: '/', icon: '⌂' },
  { label: 'Music', href: '/music', icon: '♪' },
  { label: 'Ask', href: '/ask', icon: '✦' },
  { label: 'Account', href: '/sign-in', icon: '◉' },
]

export function SiteNav() {
  const pathname = usePathname()
  const active = (href: string) => href === '/' ? pathname === '/' : pathname === href || pathname?.startsWith(`${href}/`) || (href === '/sign-in' && pathname?.startsWith('/account'))

  return <>
    <nav className="sticky top-0 z-50 border-b backdrop-blur-2xl" style={{ borderColor: 'color-mix(in srgb,var(--cosmos-divider) 75%,transparent)', background: 'var(--nav-bg)' }}>
      <div className="otya-shell h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="Otya home">
          <span className="w-9 h-9 grid place-items-center shrink-0 rounded-xl" style={{ background: 'linear-gradient(145deg,color-mix(in srgb,var(--cosmos-primary) 18%,transparent),color-mix(in srgb,var(--cosmos-cyan) 12%,transparent))' }}>
            <Image src="/otya-icon.svg" alt="" width={36} height={36} priority className="w-full h-full object-contain" />
          </span>
          <span className="font-extrabold text-[17px] tracking-[-0.04em]" style={{ color: 'var(--cosmos-text-primary)' }}>Otya</span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {DESKTOP_LINKS.map(({ label, href }) => <Link key={href} href={href} className="text-[13px] font-bold py-1" style={{ color: active(href) ? 'var(--cosmos-text-primary)' : 'var(--cosmos-text-secondary)' }}>{label}</Link>)}
        </div>

        <div className="flex items-center gap-2">
          <Link href="/download/otya-player" className="md:hidden cosmos-button rounded-full px-3.5 py-1.5 text-[12px] font-bold">Get app</Link>
          <Link href="/sign-in" className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full text-[13px] font-semibold otya-quiet-button">Account</Link>
        </div>
      </div>
    </nav>

    <nav className="md:hidden fixed inset-x-0 bottom-0 z-[70] px-2.5 pb-[max(8px,env(safe-area-inset-bottom))] pointer-events-none" aria-label="Otya navigation">
      <div className="pointer-events-auto mx-auto max-w-[430px] min-h-[62px] grid grid-cols-4 gap-1 rounded-[22px] border p-1.5 backdrop-blur-2xl" style={{ background: 'color-mix(in srgb,var(--cosmos-app-bar) 92%,transparent)', borderColor: 'color-mix(in srgb,var(--cosmos-divider) 78%,transparent)', boxShadow: '0 16px 50px rgba(0,0,0,.24)' }}>
        {MOBILE_LINKS.map(item => <Link key={item.href} href={item.href} className="min-h-[50px] rounded-[17px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-extrabold" style={{ color: active(item.href) ? 'var(--cosmos-text-primary)' : 'var(--cosmos-text-secondary)', background: active(item.href) ? 'color-mix(in srgb,var(--cosmos-primary) 15%,transparent)' : 'transparent' }}>
          <span className="text-[18px] leading-none" aria-hidden="true">{item.icon}</span><span>{item.label}</span>
        </Link>)}
      </div>
    </nav>
  </>
}
