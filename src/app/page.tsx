import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getKV } from '@/lib/d1'

export const metadata: Metadata = {
  title: 'PeterSmart Link — Smart Technology. Simple Solutions.',
  description: 'PeterSmart Link builds useful software and provides trusted technology services in Uganda. Discover OTYA Player and our local services.',
  alternates: { canonical: 'https://petersmartlink.com' },
}

const services = [
  ['Mobile Money', 'MTN and Airtel deposits, withdrawals, transfers and bill payments.'],
  ['Phones & Accessories', 'Smartphones, feature phones, accessories and everyday electronics.'],
  ['Digital Services', 'Airtime, data, Quickteller services and practical digital support.'],
  ['Device Financing', 'Selected smartphones available with flexible financing options.'],
]

const otyaFeatures = ['Offline music & video', 'Background playback', 'Lock-screen controls', 'Private media tools', 'Fast local sharing', 'No subscription required']

export default async function HomePage() {
  let appVersion = '1.5.0'
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
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 78% 42%, rgba(124,58,237,.20), transparent 42%), radial-gradient(ellipse at 20% 80%, rgba(91,33,182,.08), transparent 38%)' }} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 relative">
          <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-14 items-center">
            <div>
              <p className="text-xs uppercase tracking-[.22em] font-semibold mb-5" style={{ color: 'var(--cosmos-primary)' }}>PeterSmart Link · Uganda</p>
              <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.02] mb-6">Smart Technology.<br/><span style={{ color: 'var(--cosmos-primary)' }}>Simple Solutions.</span></h1>
              <p className="text-base sm:text-lg leading-relaxed max-w-xl mb-8" style={{ color: 'var(--cosmos-text-secondary)' }}>We build practical software and provide technology services that make everyday tasks simpler, faster and more connected.</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/otya-player" className="cosmos-button px-5 py-3 rounded-xl font-semibold text-sm">Explore our products</Link>
                <Link href="/services" className="px-5 py-3 rounded-xl font-semibold text-sm border" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-card)' }}>Our services</Link>
              </div>
              <div className="grid grid-cols-3 gap-5 mt-10 max-w-lg">
                {[['Private', 'Your data stays yours'], ['Fast', 'Built for everyday use'], ['Reliable', 'Designed to keep working']].map(([a,b]) => <div key={a}><p className="font-bold text-sm">{a}</p><p className="text-[11px] mt-1" style={{ color: 'var(--cosmos-text-secondary)' }}>{b}</p></div>)}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-10 rounded-full blur-3xl opacity-30" style={{ background: 'var(--cosmos-primary)' }} />
              <div className="relative rounded-[28px] border p-6 sm:p-8" style={{ borderColor: 'var(--cosmos-divider)', background: 'linear-gradient(145deg, rgba(20,20,28,.96), rgba(8,8,13,.96))' }}>
                <div className="flex items-center gap-4 mb-6">
                  <Image src="/played-icon.png" alt="OTYA Player" width={64} height={64} className="rounded-2xl" />
                  <div><p className="text-xs mb-1" style={{ color: 'var(--cosmos-text-secondary)' }}>Featured product</p><h2 className="text-2xl font-black">OTYA Player</h2></div>
                </div>
                <p className="leading-relaxed mb-6" style={{ color: 'var(--cosmos-text-secondary)' }}>Your offline-first Android media player for music, video and useful media tools.</p>
                <div className="grid sm:grid-cols-2 gap-3 mb-7">
                  {otyaFeatures.map(x => <div key={x} className="flex items-center gap-2 text-sm"><span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: 'rgba(139,92,246,.16)', color: 'var(--cosmos-primary)' }}>✓</span>{x}</div>)}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link href="/download/otya-player" className="cosmos-button px-5 py-3 rounded-xl font-semibold text-sm">Download OTYA</Link>
                  <span className="text-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>Android · v{appVersion}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="max-w-2xl mb-10"><p className="text-xs uppercase tracking-[.2em] font-semibold mb-3" style={{ color: 'var(--cosmos-primary)' }}>What we do</p><h2 className="text-3xl sm:text-4xl font-black mb-3">Technology for real life.</h2><p style={{ color: 'var(--cosmos-text-secondary)' }}>Software products and local services, under one trusted PeterSmart Link brand.</p></div>
        <div className="grid sm:grid-cols-2 gap-4">
          {services.map(([name,desc], i) => <div key={name} className="modern-card p-6"><div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black mb-5" style={{ background: 'rgba(139,92,246,.12)', color: 'var(--cosmos-primary)' }}>{String(i+1).padStart(2,'0')}</div><h3 className="font-bold text-lg mb-2">{name}</h3><p className="text-sm leading-relaxed" style={{ color: 'var(--cosmos-text-secondary)' }}>{desc}</p></div>)}
        </div>
      </section>

      <section className="border-y" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-surface)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div><p className="text-xs uppercase tracking-[.2em] font-semibold mb-3" style={{ color: 'var(--cosmos-primary)' }}>OTYA Player</p><h2 className="text-3xl font-black mb-2">Your media. Your way.</h2><p className="max-w-xl" style={{ color: 'var(--cosmos-text-secondary)' }}>Play locally, stay in control, and keep your library useful even when you are offline.</p></div>
          <div className="flex gap-3"><Link href="/otya-player" className="px-5 py-3 rounded-xl border font-semibold text-sm" style={{ borderColor: 'var(--cosmos-divider)' }}>Learn more</Link><Link href="/download/otya-player" className="cosmos-button px-5 py-3 rounded-xl font-semibold text-sm">Get OTYA</Link></div>
        </div>
      </section>
    </main>
    <SiteFooter />
  </div>
}
