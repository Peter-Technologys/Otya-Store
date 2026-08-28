import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getKV } from '@/lib/d1'

export const metadata: Metadata = {
  title: 'OTYA — Apps, AI & One Connected Account',
  description: 'OTYA brings together OTYA Player, OTYA AI, one shared account, documents, support and future OTYA apps. Developed by PeterSmart Link in Uganda.',
  alternates: { canonical: 'https://petersmartlink.com' },
}

const services = [
  ['Mobile Money', 'MTN and Airtel deposits, withdrawals, transfers and bill payments.'],
  ['Phones & Accessories', 'Smartphones, feature phones, accessories and everyday electronics.'],
  ['Digital Services', 'Airtime, data, Quickteller services and practical digital support.'],
  ['Device Financing', 'Selected smartphones available with flexible financing options.'],
]

const otyaFeatures = ['Offline music & video', 'Optional OTYA AI', 'One OTYA account', 'Private media tools', 'Fast local sharing', 'No subscription required']

function OtyaMark() {
  return <div className="h-16 w-16 rounded-[20px] flex items-center justify-center border" style={{ borderColor: 'rgba(139,92,246,.30)', background: 'linear-gradient(145deg, rgba(139,92,246,.18), rgba(17,17,24,.96))', boxShadow: '0 16px 44px rgba(80,45,160,.20)' }}>
    <svg width="30" height="30" viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <circle cx="17" cy="17" r="15" stroke="#A78BFA" strokeWidth="2" opacity=".85" />
      <path d="M14 11.5L24 17L14 22.5V11.5Z" fill="#F7F5FF" />
    </svg>
  </div>
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
      <section className="relative overflow-hidden border-b" style={{ borderColor: 'var(--cosmos-divider)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 78% 42%, rgba(124,58,237,.16), transparent 40%), radial-gradient(ellipse at 18% 82%, rgba(91,33,182,.06), transparent 36%)' }} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 relative">
          <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-14 items-center">
            <div>
              <p className="text-xs uppercase tracking-[.22em] font-semibold mb-5" style={{ color: 'var(--cosmos-primary)' }}>OTYA · Developed by PeterSmart Link</p>
              <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.02] mb-6">One account.<br/><span style={{ color: 'var(--cosmos-primary)' }}>More useful technology.</span></h1>
              <p className="text-base sm:text-lg leading-relaxed max-w-xl mb-8" style={{ color: 'var(--cosmos-text-secondary)' }}>OTYA connects apps, AI, support and a shared account without making every product depend on the cloud. Start with OTYA Player and use the same identity across future OTYA products.</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/apps" className="cosmos-button px-5 py-3 rounded-xl font-semibold text-sm">Explore OTYA Apps</Link>
                <Link href="/ai" className="px-5 py-3 rounded-xl font-semibold text-sm border" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-card)' }}>Open OTYA AI</Link>
                <Link href="/documents" className="px-5 py-3 rounded-xl font-semibold text-sm border" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-card)' }}>Documents</Link>
              </div>
              <div className="grid grid-cols-3 gap-5 mt-10 max-w-lg">
                {[['One account', 'Shared OTYA identity'], ['Private', 'Product data stays scoped'], ['Reliable', 'Player works offline']].map(([a,b]) => <div key={a}><p className="font-bold text-sm">{a}</p><p className="text-[11px] mt-1" style={{ color: 'var(--cosmos-text-secondary)' }}>{b}</p></div>)}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-10 rounded-full blur-3xl opacity-20" style={{ background: 'var(--cosmos-primary)' }} />
              <div className="relative rounded-[28px] border p-6 sm:p-8" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-card)' }}>
                <div className="flex items-center gap-4 mb-6">
                  <OtyaMark />
                  <div><p className="text-xs mb-1" style={{ color: 'var(--cosmos-text-secondary)' }}>Featured app</p><h2 className="text-2xl font-black">OTYA Player</h2><p className="text-[11px] mt-1" style={{ color: 'var(--cosmos-primary)' }}>Media first · AI optional</p></div>
                </div>
                <p className="leading-relaxed mb-6" style={{ color: 'var(--cosmos-text-secondary)' }}>Your offline-first Android media experience for music, video and useful local media tools.</p>
                <div className="grid sm:grid-cols-2 gap-3 mb-7">
                  {otyaFeatures.map(x => <div key={x} className="flex items-center gap-2 text-sm"><span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: 'rgba(139,92,246,.14)', color: 'var(--cosmos-primary)' }}>✓</span>{x}</div>)}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link href="/download/otya-player" className="cosmos-button px-5 py-3 rounded-xl font-semibold text-sm">Get OTYA Player</Link>
                  <span className="text-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>Android · v{appVersion}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="max-w-2xl mb-10"><p className="text-xs uppercase tracking-[.2em] font-semibold mb-3" style={{ color: 'var(--cosmos-primary)' }}>PeterSmart Link services</p><h2 className="text-3xl sm:text-4xl font-black mb-3">The business behind OTYA also serves locally.</h2><p style={{ color: 'var(--cosmos-text-secondary)' }}>These local services are provided by PeterSmart Link; they are not separate OTYA apps or account features.</p></div>
        <div className="grid sm:grid-cols-2 gap-4">
          {services.map(([name,desc], i) => <div key={name} className="modern-card p-6"><div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black mb-5" style={{ background: 'rgba(139,92,246,.10)', color: 'var(--cosmos-primary)' }}>{String(i+1).padStart(2,'0')}</div><h3 className="font-bold text-lg mb-2">{name}</h3><p className="text-sm leading-relaxed" style={{ color: 'var(--cosmos-text-secondary)' }}>{desc}</p></div>)}
        </div>
        <Link href="/services" className="inline-block mt-6 text-sm font-bold" style={{color:'var(--cosmos-primary)'}}>View PeterSmart Link services →</Link>
      </section>

      <section className="border-y" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-surface)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div><p className="text-xs uppercase tracking-[.2em] font-semibold mb-3" style={{ color: 'var(--cosmos-primary)' }}>Your OTYA account</p><h2 className="text-3xl font-black mb-2">One identity, separately scoped products.</h2><p className="max-w-xl" style={{ color: 'var(--cosmos-text-secondary)' }}>Sign in once to OTYA. Each product can use the same account ID while keeping its product-specific data and permissions separate.</p></div>
          <div className="flex flex-wrap gap-3"><Link href="/my-account" className="cosmos-button px-5 py-3 rounded-xl font-semibold text-sm">My Account</Link><Link href="/documents" className="px-5 py-3 rounded-xl border font-semibold text-sm" style={{ borderColor: 'var(--cosmos-divider)' }}>Documents</Link></div>
        </div>
      </section>
    </main>
    <SiteFooter />
  </div>
}
