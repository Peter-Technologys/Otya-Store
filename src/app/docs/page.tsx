import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata = {
  title: 'Docs | OTYA',
  description: 'Official OTYA documentation for products, account, security, privacy, support and releases.',
  alternates: { canonical: 'https://petersmartlink.com/docs' },
}

const groups = [
  {
    title: 'Account',
    items: [
      ['OTYA Account','Identity, profile, recovery, sessions and connected accounts.','/account'],
      ['Security','Verification, account safety and security reporting.','/apps/otya-player/security'],
      ['Privacy','How OTYA handles account and service information.','/privacy'],
      ['Terms','Terms for OTYA accounts and connected services.','/terms'],
    ],
  },
  {
    title: 'OTYA Player',
    items: [
      ['Player overview','Product information and capabilities.','/otya-player'],
      ['Support & FAQ','Troubleshooting and support contact.','/apps/otya-player/support'],
      ['Release & download','Current version, download and release information.','/download/otya-player'],
      ['Player privacy','Product-specific privacy information.','/apps/otya-player/privacy'],
      ['Player terms','Product-specific terms.','/apps/otya-player/terms'],
    ],
  },
  {
    title: 'OTYA AI',
    items: [
      ['Open OTYA AI','General assistant and OTYA-aware support.','/ai'],
      ['AI account settings','Models, account security and saved conversation access.','/account#ai'],
    ],
  },
]

export default function DocsPage(){
  return <div className="min-h-screen flex flex-col" style={{background:'var(--cosmos-scaffold)',color:'var(--cosmos-text-primary)'}}>
    <SiteNav />
    <main className="flex-1">
      <div className="otya-shell py-12 sm:py-16">
        <header className="max-w-2xl mb-10">
          <div className="otya-kicker mb-3">Documentation</div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-.04em]">OTYA Docs</h1>
          <p className="mt-3 text-sm sm:text-[15px] otya-muted">Official product, account, security, legal and support information.</p>
        </header>

        <div className="grid lg:grid-cols-[180px_1fr] gap-8 lg:gap-12">
          <aside className="hidden lg:block text-sm">
            <nav className="sticky top-20 space-y-1">
              {groups.map(group=><a key={group.title} href={`#${group.title.toLowerCase().replaceAll(' ','-')}`} className="block py-1.5 otya-muted">{group.title}</a>)}
              <a href="#data" className="block py-1.5 otya-muted">Data requests</a>
            </nav>
          </aside>

          <div className="max-w-3xl">
            {groups.map(group=><section key={group.title} id={group.title.toLowerCase().replaceAll(' ','-')} className="mb-10 scroll-mt-24">
              <h2 className="text-base font-semibold mb-2">{group.title}</h2>
              <div className="border-y" style={{borderColor:'var(--cosmos-divider)'}}>
                {group.items.map(([title,description,href],index)=><Link key={title} href={href} className={`grid sm:grid-cols-[190px_1fr_auto] gap-1 sm:gap-5 items-start py-4 ${index<group.items.length-1?'border-b':''}`} style={{borderColor:'var(--cosmos-divider)'}}>
                  <span className="text-sm font-medium">{title}</span>
                  <span className="text-sm otya-muted">{description}</span>
                  <span className="text-sm otya-muted hidden sm:block">→</span>
                </Link>)}
              </div>
            </section>)}

            <section id="data" className="scroll-mt-24 border-t pt-8" style={{borderColor:'var(--cosmos-divider)'}}>
              <h2 className="text-base font-semibold">Account data requests</h2>
              <p className="text-sm otya-muted mt-2 max-w-xl">Private exports, deletion records and account-specific documents are released only after identity verification.</p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium">
                <a href="mailto:support@petersmartlink.com?subject=OTYA%20Account%20Data%20Request">Request my data →</a>
                <Link href="/account">Manage account →</Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
    <SiteFooter />
  </div>
}
