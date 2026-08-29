import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { OtyaAssistPrompt } from '@/components/OtyaAssistPrompt'

export const metadata = {
  title: 'Docs | OTYA',
  description: 'Official OTYA help for playback, account, security, privacy, support and releases.',
  alternates: { canonical: 'https://petersmartlink.com/docs' },
}

const groups = [
  {
    title: 'Using OTYA',
    items: [
      ['OTYA overview','See the main app features and how they fit together.','/otya-player'],
      ['Support & FAQ','Fix common playback, permission, transfer and library problems.','/apps/otya-player/support'],
      ['Download & updates','Get the latest Android build and release information.','/download/otya-player'],
      ['Security','Read OTYA security guidance.','/apps/otya-player/security'],
    ],
  },
  {
    title: 'Account',
    items: [
      ['My account','Profile, recovery, sessions, backup and connected identities.','/account'],
      ['Privacy','How OTYA handles account and service information.','/privacy'],
      ['Terms','Terms for using OTYA and connected services.','/terms'],
    ],
  },
]

export default function DocsPage(){
  return <div className="min-h-screen flex flex-col" style={{background:'var(--cosmos-scaffold)',color:'var(--cosmos-text-primary)'}}>
    <SiteNav />
    <main className="flex-1">
      <div className="otya-shell py-12 sm:py-16">
        <header className="max-w-2xl mb-7">
          <div className="otya-kicker mb-3">Help</div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-.04em]">OTYA Docs</h1>
          <p className="mt-3 text-sm sm:text-[15px] otya-muted">Find simple help for OTYA. You can also ask a question below.</p>
        </header>

        <div className="mb-10"><OtyaAssistPrompt /></div>

        <div className="grid lg:grid-cols-[180px_1fr] gap-8 lg:gap-12">
          <aside className="hidden lg:block text-sm">
            <nav className="sticky top-20 space-y-1">
              {groups.map(group=><a key={group.title} href={`#${group.title.toLowerCase().replaceAll(' ','-')}`} className="block py-1.5 otya-muted">{group.title}</a>)}
              <a href="#data" className="block py-1.5 otya-muted">My data</a>
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
              <h2 className="text-base font-semibold">My account data</h2>
              <p className="text-sm otya-muted mt-2 max-w-xl">Private exports and account-specific records are released only after identity checks.</p>
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
