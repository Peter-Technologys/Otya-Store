import Link from 'next/link'
import Image from 'next/image'

export function SiteFooter() {
  return <footer className="border-t" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-app-bar)' }}>
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid sm:grid-cols-[1.4fr_1fr_1fr_1fr] gap-8 mb-10">
        <div>
          <div className="flex items-center gap-2.5 mb-3"><Image src="/web-app-manifest-192x192.png" alt="PeterSmart Link" width={30} height={30} className="rounded-lg"/><span className="font-bold">PeterSmart <span style={{ color: 'var(--cosmos-primary)' }}>Link</span></span></div>
          <p className="text-xs leading-relaxed max-w-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>Useful technology, software and local digital services from Uganda.</p>
        </div>
        <FooterGroup title="Company" links={[["Home","/"],["Services","/services"],["Contact","/contact"],["Blog","/blog"]]} />
        <FooterGroup title="OTYA Player" links={[["Product","/otya-player"],["Download","/download/otya-player"],["Support","/apps/otya-player/support"],["Privacy","/apps/otya-player/privacy"]]} />
        <FooterGroup title="Legal" links={[["Privacy","/privacy"],["Terms","/terms"]]} />
      </div>
      <div className="border-t pt-5 flex flex-col sm:flex-row justify-between gap-2 text-xs" style={{ borderColor: 'var(--cosmos-divider)', color: 'var(--cosmos-text-secondary)' }}><span>© {new Date().getFullYear()} PeterSmart Link</span><span>Built in Uganda 🇺🇬</span></div>
    </div>
  </footer>
}

function FooterGroup({ title, links }: { title: string; links: string[][] }) {
  return <div><p className="font-bold text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--cosmos-text-secondary)' }}>{title}</p><div className="space-y-2">{links.map(([label, href]) => <Link key={href} href={href} className="block text-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>{label}</Link>)}</div></div>
}
