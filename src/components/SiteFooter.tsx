import Link from 'next/link'
import Image from 'next/image'

const LINKS = [
  ['Privacy', '/privacy'],
  ['Terms', '/terms'],
  ['Contact', '/contact'],
  ['Security', '/apps/otya-player/security'],
  ['Changelog', '/apps/otya-player/changelog'],
]

export function SiteFooter() {
  return (
    <footer className="border-t" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-app-bar)' }}>
      <div className="otya-shell py-5 sm:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link href="/" className="inline-flex items-center gap-2.5 w-fit">
          <Image src="/otya-icon.svg" alt="" width={28} height={28} className="object-contain" />
          <span className="font-black text-sm">OTYA</span>
        </Link>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>
          {LINKS.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </div>
        <span className="text-[11px]" style={{ color: 'var(--cosmos-text-secondary)' }}>© {new Date().getFullYear()} OTYA · Uganda</span>
      </div>
    </footer>
  )
}
