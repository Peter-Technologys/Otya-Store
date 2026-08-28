import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getKV } from '@/lib/d1'

export const metadata: Metadata = {
  title: 'OTYA',
  description: 'OTYA builds useful software, AI and one connected account. Developed by PeterSmart Link in Uganda.',
  alternates: { canonical: 'https://petersmartlink.com' },
}

export default async function HomePage() {
  let appVersion = '1.7.0'
  try {
    const { env } = await getCloudflareContext()
    const kv = getKV(env as Record<string, unknown>)
    const raw = await kv.get('LATEST_BUILD_INFO')
    if (raw) appVersion = (JSON.parse(raw) as { version?: string }).version || appVersion
  } catch {}

  return <div className="min-h-screen flex flex-col" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
    <SiteNav />
    <main className="flex-1">
      <section className="border-b" style={{ borderColor: 'var(--cosmos-divider)' }}>
        <div className="otya-shell py-16 sm:py-24">
          <div className="max-w-3xl">
            <div className="otya-kicker mb-5">OTYA · by PeterSmart Link</div>
            <h1 className="otya-page-title max-w-2xl">Technology that stays out of your way.</h1>
            <p className="mt-5 max-w-xl text-base sm:text-lg otya-muted">Apps, AI and one account—designed to be useful, private and dependable.</p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link href="/apps" className="cosmos-button rounded-lg px-4 py-2.5 text-sm font-semibold">Explore products</Link>
              <Link href="/ai" className="otya-quiet-button rounded-lg px-4 py-2.5 text-sm font-semibold">Open OTYA AI</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="otya-shell py-12 sm:py-16">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div><div className="otya-kicker mb-2">Products</div><h2 className="otya-section-title">One family. Clear roles.</h2></div>
          <Link href="/apps" className="hidden sm:block text-sm font-medium otya-muted">View all →</Link>
        </div>

        <div className="border-y" style={{ borderColor: 'var(--cosmos-divider)' }}>
          <ProductRow
            title="OTYA Player"
            meta={`Android · v${appVersion}`}
            description="Offline-first music and video playback with private local media tools."
            href="/otya-player"
            action="View Player"
          />
          <ProductRow
            title="OTYA AI"
            meta="Cloud service"
            description="A general assistant with OTYA knowledge, saved chats, model choice and account-aware support."
            href="/ai"
            action="Open AI"
          />
          <ProductRow
            title="OTYA Account"
            meta="Identity & security"
            description="One secure identity for OTYA products, sessions, recovery, connected accounts and privacy controls."
            href="/account"
            action="Manage account"
            last
          />
        </div>
      </section>

      <section className="border-y" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-surface)' }}>
        <div className="otya-shell py-12 sm:py-14 grid md:grid-cols-[1fr_1.2fr] gap-8 md:gap-14 items-start">
          <div><div className="otya-kicker mb-2">Principles</div><h2 className="otya-section-title">Built for everyday use.</h2></div>
          <div className="grid sm:grid-cols-3 gap-6">
            <Principle title="Private" text="Product data stays separately scoped." />
            <Principle title="Resilient" text="Player keeps working when cloud services do not." />
            <Principle title="Connected" text="One account works across the OTYA family." />
          </div>
        </div>
      </section>

      <section className="otya-shell py-12 sm:py-16">
        <div className="grid md:grid-cols-[1fr_1.4fr] gap-8 md:gap-14">
          <div>
            <div className="otya-kicker mb-2">PeterSmart Link</div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">The company behind OTYA.</h2>
          </div>
          <div>
            <p className="otya-muted max-w-xl">PeterSmart Link develops OTYA and also provides local mobile money, phones, accessories and digital services in Uganda.</p>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
              <Link href="/services">Local services →</Link>
              <Link href="/docs">Docs →</Link>
              <Link href="/apps/otya-player/support">Support →</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
    <SiteFooter />
  </div>
}

function ProductRow({title,meta,description,href,action,last=false}:{title:string;meta:string;description:string;href:string;action:string;last?:boolean}){
  return <div className={`grid md:grid-cols-[1.05fr_1.7fr_auto] gap-2 md:gap-8 items-center py-6 ${last?'':'border-b'}`} style={{ borderColor: 'var(--cosmos-divider)' }}>
    <div><h3 className="text-lg font-semibold tracking-tight">{title}</h3><div className="text-xs mt-1 otya-muted">{meta}</div></div>
    <p className="text-sm otya-muted max-w-xl">{description}</p>
    <Link href={href} className="text-sm font-semibold mt-2 md:mt-0">{action} →</Link>
  </div>
}

function Principle({title,text}:{title:string;text:string}){
  return <div><div className="text-sm font-semibold mb-1">{title}</div><p className="text-sm otya-muted">{text}</p></div>
}
