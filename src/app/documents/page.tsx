import Link from 'next/link'

export const metadata = {
  title: 'Documents',
  description: 'Official OTYA legal, privacy, support, release and account documents.',
}

const docs = [
  {
    title: 'OTYA Terms of Service',
    description: 'The terms that apply to the shared OTYA account and connected OTYA services.',
    href: '/terms',
    label: 'Legal',
  },
  {
    title: 'OTYA Privacy Policy',
    description: 'How OTYA handles account, service, support and product information.',
    href: '/privacy',
    label: 'Privacy',
  },
  {
    title: 'OTYA Player Terms',
    description: 'Product-specific terms for OTYA Player.',
    href: '/apps/otya-player/terms',
    label: 'Player',
  },
  {
    title: 'OTYA Player Privacy',
    description: 'Product-specific privacy information for the media player.',
    href: '/apps/otya-player/privacy',
    label: 'Player',
  },
  {
    title: 'Support & Help',
    description: 'Get help, contact support and find OTYA Player support information.',
    href: '/apps/otya-player/support',
    label: 'Support',
  },
  {
    title: 'OTYA Account',
    description: 'Review your shared OTYA identity, consent status and AI preferences.',
    href: '/my-account',
    label: 'Account',
  },
  {
    title: 'Release & Download Information',
    description: 'Current OTYA Player release information, APK downloads and update notes.',
    href: '/download/otya-player',
    label: 'Release',
  },
  {
    title: 'OTYA AI',
    description: 'Open the general assistant, manage signed-in conversations and use available models.',
    href: '/ai',
    label: 'AI',
  },
]

export default function DocumentsPage(){
  return <main className="min-h-screen px-4 py-10 sm:px-6 sm:py-14" style={{background:'var(--cosmos-scaffold)',color:'var(--cosmos-text-primary)'}}>
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
        <div>
          <div className="text-sm font-bold" style={{color:'var(--cosmos-primary)'}}>OTYA</div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mt-1">Documents</h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base opacity-65 leading-7">The official place for OTYA legal documents, privacy information, account information, support and current product documentation.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/" className="rounded-xl border px-4 py-2.5 text-sm font-semibold" style={{borderColor:'var(--cosmos-divider)'}}>Home</Link>
          <Link href="/my-account" className="cosmos-button rounded-xl px-4 py-2.5 text-sm font-semibold">My account</Link>
        </div>
      </div>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {docs.map(doc=><Link key={doc.title} href={doc.href} className="rounded-2xl border p-5 block" style={{background:'var(--cosmos-card)',borderColor:'var(--cosmos-divider)'}}>
          <div className="text-[11px] uppercase tracking-wider font-bold opacity-50">{doc.label}</div>
          <h2 className="text-lg font-bold mt-2">{doc.title}</h2>
          <p className="text-sm opacity-60 leading-6 mt-2">{doc.description}</p>
          <div className="mt-5 text-sm font-semibold" style={{color:'var(--cosmos-primary)'}}>Open document →</div>
        </Link>)}
      </section>

      <section className="rounded-2xl border p-5 sm:p-6 mt-8" style={{background:'var(--cosmos-card)',borderColor:'var(--cosmos-divider)'}}>
        <h2 className="text-xl font-bold">Need another document?</h2>
        <p className="text-sm opacity-60 mt-2 leading-6">For account data requests, support records, billing or another official OTYA document, contact support. Private account documents should only be provided after identity verification.</p>
        <a href="mailto:support@petersmartlink.com?subject=OTYA%20Document%20Request" className="inline-block mt-4 cosmos-button rounded-xl px-4 py-2.5 text-sm font-semibold">Request a document</a>
      </section>

      <p className="text-xs opacity-45 mt-8">OTYA is developed and operated by PeterSmart Link. Product-specific documents may apply in addition to the shared OTYA terms and privacy policy.</p>
    </div>
  </main>
}
