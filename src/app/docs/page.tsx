import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata = {
  title: 'Docs | OTYA',
  description: 'Official OTYA docs for accounts, privacy, security, support, releases and products.',
  alternates: { canonical: 'https://petersmartlink.com/docs' },
}

const docs = [
  { title: 'OTYA Terms', description: 'Terms for the shared OTYA account and connected OTYA services.', href: '/terms', label: 'Legal' },
  { title: 'OTYA Privacy', description: 'How OTYA handles account, service, support and product information.', href: '/privacy', label: 'Privacy' },
  { title: 'OTYA Account', description: 'Profile, security, verification, products, consent and account controls.', href: '/my-account', label: 'Account' },
  { title: 'OTYA Player Terms', description: 'Product-specific terms for OTYA Player.', href: '/apps/otya-player/terms', label: 'Player' },
  { title: 'OTYA Player Privacy', description: 'Product-specific privacy information for OTYA Player.', href: '/apps/otya-player/privacy', label: 'Player' },
  { title: 'Security', description: 'Official security guidance, reporting and account-safety information.', href: '/apps/otya-player/security', label: 'Security' },
  { title: 'Support & FAQ', description: 'Get help, contact OTYA Support and find common answers.', href: '/apps/otya-player/support', label: 'Support' },
  { title: 'Releases', description: 'Current OTYA Player version, downloads, checksums and update notes.', href: '/download/otya-player', label: 'Release' },
  { title: 'OTYA AI', description: 'OTYA AI usage, account conversations and model access.', href: '/ai', label: 'AI' },
]

export default function DocsPage(){
  return <div className="min-h-screen flex flex-col" style={{background:'var(--cosmos-scaffold)',color:'var(--cosmos-text-primary)'}}>
    <SiteNav />
    <main className="flex-1 px-4 py-10 sm:px-6 sm:py-14">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div>
            <div className="text-sm font-bold" style={{color:'var(--cosmos-primary)'}}>OTYA</div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mt-1">Docs</h1>
            <p className="mt-3 max-w-2xl text-sm sm:text-base opacity-65 leading-7">Official OTYA account, legal, privacy, security, support, release and product documentation.</p>
          </div>
          <Link href="/my-account" className="cosmos-button rounded-xl px-4 py-2.5 text-sm font-semibold">My account</Link>
        </div>

        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map(doc=><Link key={doc.title} href={doc.href} className="rounded-2xl border p-5 block" style={{background:'var(--cosmos-card)',borderColor:'var(--cosmos-divider)'}}>
            <div className="text-[11px] uppercase tracking-wider font-bold opacity-50">{doc.label}</div>
            <h2 className="text-lg font-bold mt-2">{doc.title}</h2>
            <p className="text-sm opacity-60 leading-6 mt-2">{doc.description}</p>
            <div className="mt-5 text-sm font-semibold" style={{color:'var(--cosmos-primary)'}}>Open →</div>
          </Link>)}
        </section>

        <section className="rounded-2xl border p-5 sm:p-6 mt-8" style={{background:'var(--cosmos-card)',borderColor:'var(--cosmos-divider)'}}>
          <h2 className="text-xl font-bold">Account data & official records</h2>
          <p className="text-sm opacity-60 mt-2 leading-6">Private exports, deletion records, support records and other account-specific documents must only be released after identity verification.</p>
          <a href="mailto:support@petersmartlink.com?subject=OTYA%20Docs%20Request" className="inline-block mt-4 cosmos-button rounded-xl px-4 py-2.5 text-sm font-semibold">Request account data</a>
        </section>
      </div>
    </main>
    <SiteFooter />
  </div>
}
