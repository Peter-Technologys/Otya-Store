import Link from 'next/link'
import Image from 'next/image'

export function SiteFooter() {
  return <footer className="border-t" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-app-bar)' }}>
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid sm:grid-cols-[1.4fr_1fr_1fr_1fr] gap-8 mb-10">
        <div>
          <div className="flex items-center gap-2.5 mb-3"><Image src="/web-app-manifest-192x192.png" alt="OTYA" width={30} height={30} className="rounded-lg"/><span className="font-extrabold">OTYA</span></div>
          <p className="text-xs leading-relaxed max-w-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>Apps, AI, one shared account, support and connected services — developed by PeterSmart Link in Uganda.</p>
        </div>
        <FooterGroup title="OTYA" links={[["Apps","/apps"],["OTYA AI","/ai"],["My Account","/my-account"],["Docs","/docs"]]} />
        <FooterGroup title="OTYA Player" links={[["Product","/otya-player"],["Download","/download/otya-player"],["Changelog","/apps/otya-player/changelog"],["Support","/apps/otya-player/support"],["Security","/apps/otya-player/security"],["Privacy","/apps/otya-player/privacy"]]} />
        <FooterGroup title="Legal & Help" links={[["Privacy","/privacy"],["Terms","/terms"],["Docs","/docs"],["Contact","/contact"]]} />
      </div>
      <div className="border-t pt-5 flex flex-col sm:flex-row justify-between gap-2 text-xs" style={{ borderColor: 'var(--cosmos-divider)', color: 'var(--cosmos-text-secondary)' }}><span>© {new Date().getFullYear()} OTYA · Developed by PeterSmart Link</span><span>Built in Uganda 🇺🇬</span></div>
    </div>
  </footer>
}

function FooterGroup({ title, links }: { title: string; links: string[][] }) {
  return <div><p className="font-bold text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--cosmos-text-secondary)' }}>{title}</p><div className="space-y-2">{links.map(([label, href]) => <Link key={href} href={href} className="block text-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>{label}</Link>)}</div></div>
}
