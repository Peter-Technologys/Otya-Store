'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const LINKS = [
  { label: 'Music', href: '/music' },
  { label: 'Ask Otya', href: '/ask' },
  { label: 'Get Otya', href: '/download/otya-player' },
]

export function SiteNav() {
  const pathname = usePathname()
  const active = (href: string) => href === '/' ? pathname === '/' : pathname === href || pathname?.startsWith(`${href}/`)

  return <nav className="sticky top-0 z-50 border-b backdrop-blur-2xl" style={{ borderColor:'color-mix(in srgb,var(--cosmos-divider) 75%,transparent)', background:'var(--nav-bg)' }}>
    <div className="otya-shell min-h-14 py-2 flex items-center gap-3">
      <Link href="/" className="flex items-center gap-2 shrink-0 mr-auto" aria-label="Otya home">
        <Image src="/otya-icon.svg" alt="" width={34} height={34} priority className="w-[34px] h-[34px] object-contain" />
        <span className="font-extrabold text-[17px] tracking-[-.04em]">Otya</span>
      </Link>

      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[68vw] sm:max-w-none">
        {LINKS.map(({label,href}) => <Link key={href} href={href} className="shrink-0 rounded-full px-3 py-2 text-xs sm:text-[13px] font-bold" style={{ color:active(href)?'var(--cosmos-text-primary)':'var(--cosmos-text-secondary)', background:active(href)?'color-mix(in srgb,var(--cosmos-primary) 12%,transparent)':'transparent' }}>{label}</Link>)}
        <Link href="/sign-in" className="shrink-0 rounded-full px-3 py-2 text-xs sm:text-[13px] font-bold otya-quiet-button">Account</Link>
      </div>
    </div>
  </nav>
}
