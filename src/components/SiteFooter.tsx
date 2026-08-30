import Link from 'next/link'
import Image from 'next/image'

const LINKS = [['Help','/help'],['Privacy','/privacy'],['Terms','/terms']]

export function SiteFooter() {
  return <footer className="border-t mb-20 md:mb-0" style={{borderColor:'color-mix(in srgb,var(--cosmos-divider) 75%,transparent)',background:'color-mix(in srgb,var(--cosmos-app-bar) 78%,transparent)',backdropFilter:'blur(18px)'}}>
    <div className="otya-shell py-5 sm:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <Link href="/" className="inline-flex items-center gap-2.5 w-fit"><Image src="/otya-icon.svg" alt="" width={28} height={28} className="object-contain"/><span className="font-extrabold text-sm">Otya</span></Link>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold" style={{color:'var(--cosmos-text-secondary)'}}>{LINKS.map(([label,href])=><Link key={href} href={href}>{label}</Link>)}</div>
      <span className="text-[11px]" style={{color:'var(--cosmos-text-secondary)'}}>© {new Date().getFullYear()} Otya · Uganda</span>
    </div>
  </footer>
}
