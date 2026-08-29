import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Developers · OTYA',
  description: 'Build with OTYA through scoped APIs, SDKs, OAuth, signed webhooks and future MCP integrations without direct access to private OTYA infrastructure.',
  alternates: { canonical: 'https://petersmartlink.com/developers' },
}

const surfaces = [
  ['OTYA API', 'Versioned HTTPS capabilities protected by app identity, scopes, quotas and audit logging.'],
  ['Dart / Flutter SDK', 'A first-party client for Flutter apps with typed models, auth helpers, errors and pagination.'],
  ['TypeScript SDK', 'A first-party client for web and server applications using the same public API contract.'],
  ['OAuth', 'Users authorize individual applications and scopes. Developers never receive OTYA passwords.'],
  ['Signed webhooks', 'OTYA can deliver approved events to developer servers with signatures and replay protection.'],
  ['OTYA MCP', 'A future AI/agent interface over published developer capabilities, isolated from private Admin AI tools.'],
]

export default function DevelopersPage() {
  return <div className="min-h-screen flex flex-col" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
    <SiteNav />
    <main className="flex-1">
      <section className="border-b" style={{ borderColor: 'var(--cosmos-divider)' }}>
        <div className="otya-shell py-16 sm:py-24 max-w-5xl">
          <div className="otya-kicker mb-4">OTYA Developers</div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-[-.05em] leading-[.98]">Build on OTYA.<br/>Not inside our private infrastructure.</h1>
          <p className="mt-6 max-w-3xl text-base sm:text-lg leading-relaxed otya-muted">OTYA&apos;s developer platform is being designed around explicit permissions, app isolation and stable public contracts. Developers will integrate through OTYA-controlled APIs and SDKs—not Cloudflare secrets, D1/KV/R2 credentials, Firebase Admin keys or administrator access.</p>
          <div className="mt-7 inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: 'var(--cosmos-divider)' }}>Platform groundwork · not required for OTYA Player 1.0</div>
        </div>
      </section>

      <section className="otya-shell py-14 sm:py-18">
        <div className="grid md:grid-cols-[.7fr_1.3fr] gap-8 md:gap-14">
          <div>
            <div className="otya-kicker mb-2">What developers get</div>
            <h2 className="otya-section-title">Small, stable surfaces.</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-px border rounded-2xl overflow-hidden" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-divider)' }}>
            {surfaces.map(([title, text]) => <div key={title} className="p-5" style={{ background: 'var(--cosmos-card)' }}><h3 className="font-bold text-sm">{title}</h3><p className="mt-2 text-sm leading-relaxed otya-muted">{text}</p></div>)}
          </div>
        </div>
      </section>

      <section className="border-y" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-surface)' }}>
        <div className="otya-shell py-14 sm:py-18 grid md:grid-cols-[.7fr_1.3fr] gap-8 md:gap-14">
          <div><div className="otya-kicker mb-2">Security boundary</div><h2 className="otya-section-title">Three privilege levels.</h2></div>
          <div className="space-y-5 max-w-3xl">
            <Boundary title="OTYA users" text="Use OTYA products and can explicitly authorize third-party apps to limited account scopes." />
            <Boundary title="OTYA developers" text="Receive app-specific API access, quotas and logs for published capabilities only." />
            <Boundary title="OTYA Admin" text="Private operations, infrastructure, releases, support and connected-service powers stay isolated from developer apps." />
          </div>
        </div>
      </section>

      <section className="otya-shell py-14 sm:py-18">
        <div className="grid md:grid-cols-[.7fr_1.3fr] gap-8 md:gap-14">
          <div><div className="otya-kicker mb-2">Planned portal</div><h2 className="otya-section-title">Everything an app needs.</h2></div>
          <div>
            <p className="otya-muted max-w-3xl">The Developer Portal is planned around Overview, My Apps, Credentials, OAuth, Webhooks, API Explorer, Usage, Logs, SDKs, MCP and Documentation. Development and Production environments will remain separate.</p>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium"><Link href="/docs">Read OTYA docs →</Link><Link href="/contact">Developer contact →</Link><Link href="/">OTYA Player →</Link></div>
          </div>
        </div>
      </section>
    </main>
    <SiteFooter />
  </div>
}

function Boundary({ title, text }: { title: string; text: string }) {
  return <div><h3 className="text-sm font-bold">{title}</h3><p className="mt-1 text-sm leading-relaxed otya-muted">{text}</p></div>
}
