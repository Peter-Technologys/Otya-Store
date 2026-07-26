import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { Marquee } from '@/components/magicui/marquee'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getKV } from '@/lib/d1'

export const metadata: Metadata = {
  title: 'PeterSmart Technologies — Mobile Money, Phone Sales & OTYA Player | Mbirizi, Uganda',
  description: 'PeterSmart Technologies is a tech company in Mbirizi, Uganda. We run a mobile money and phone shop and build OTYA Player — a free offline media player for Android.',
  alternates: { canonical: 'https://petersmartlink.com' },
}

const WA = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'

const SHOP = [
  { emoji: '💳', name: 'Mobile Money', desc: 'MTN & Airtel MoMo — deposits, withdrawals, transfers, bill payments.', badge: 'MTN · Airtel' },
  { emoji: '📱', name: 'Phone Sales', desc: 'Latest Android smartphones and accessories at the best prices.', badge: 'In stock' },
  { emoji: '📦', name: 'Data & Airtime', desc: 'MTN and Airtel bundles at competitive rates, always available.', badge: 'Always open' },
  { emoji: '💰', name: 'Phone Loans', desc: 'Get a smartphone on loan with easy repayments.', badge: 'Flexible' },
]

const FEATURES = [
  '🎵 Offline Music Player',
  '🎬 Video Player',
  '🔒 Private Vault',
  '⚡ Flash Share',
  '🌐 Web Mirror',
  '📊 Storage Analyzer',
  '🎧 5-Band Equalizer',
  '📱 Picture-in-Picture',
  '🌙 AMOLED Theme',
  '🎄 Seasonal Themes',
]

export default async function HomePage() {
  let appVersion = '1.5.0'
  try {
    const { env } = await getCloudflareContext()
    const kv = getKV(env as Record<string, unknown>)
    const raw = await kv.get('LATEST_BUILD_INFO')
    if (raw) {
      const data = JSON.parse(raw) as { version?: string }
      if (data.version) appVersion = data.version
    }
  } catch { /* non-fatal — fallback to 1.5.0 */ }
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
      <SiteNav />

      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden border-b py-16 sm:py-24" style={{ borderColor: 'var(--cosmos-divider)' }}>
          <div className="cosmos-stars" />
          {/* Subtle gradient bg */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 30%, rgba(123,97,255,0.15), transparent 60%)' }} />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-center gap-10">
              <div className="flex-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border" style={{ borderColor: 'var(--cosmos-primary)', color: 'var(--cosmos-text-primary)', background: 'rgba(123,97,255,0.1)' }}>
                  Built in Uganda 🇺🇬
                </div>
                <h1 className="text-4xl sm:text-6xl font-black mb-4 leading-tight" style={{ color: 'var(--cosmos-text-primary)' }}>
                  PeterSmart<br />
                  <span className="cosmos-gradient-text">Technologies</span>
                </h1>
                <p className="text-base leading-relaxed mb-8 max-w-lg mx-auto sm:mx-0" style={{ color: 'var(--cosmos-text-secondary)' }}>
                  A technology company in Mbirizi, Uganda. We run a mobile money & phone shop and build <strong style={{ color: 'var(--cosmos-text-primary)' }}>OTYA Player</strong> — a free offline media player used across Uganda.
                </p>
                <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                  <a href="https://wa.me/256775912582" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-transform hover:scale-105"
                    style={{ background: '#25d366', boxShadow: '0 4px 16px rgba(37,211,102,0.35)' }}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d={WA} /></svg>
                    WhatsApp Us
                  </a>
                  <a href="mailto:support@petersmartlink.com"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm border transition-colors hover:border-purple-400"
                    style={{ borderColor: 'var(--cosmos-divider)', color: 'var(--cosmos-text-primary)', background: 'var(--cosmos-card)' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                    Email Us
                  </a>
                </div>
              </div>
              <div className="relative flex-shrink-0" style={{ animation: 'float 6s ease-in-out infinite' }}>
                <div className="absolute inset-0 rounded-3xl blur-3xl opacity-50" style={{ background: 'radial-gradient(circle, var(--cosmos-primary) 0%, var(--cosmos-accent) 100%)', transform: 'scale(1.2)' }} />
                <Image src="/web-app-manifest-192x192.png" alt="PeterSmart Technologies" width={180} height={180}
                  className="relative rounded-3xl" style={{ display: 'block', boxShadow: '0 0 40px rgba(123,97,255,0.4)', border: '2px solid rgba(123,97,255,0.3)' }} priority unoptimized />
              </div>
            </div>
          </div>
        </section>

        {/* OTYA Player Feature Marquee */}
        <section className="py-4 border-b overflow-hidden" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-surface)' }}>
          <Marquee>
            {FEATURES.map(f => (
              <span key={f} className="cosmos-pill inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold flex-shrink-0 mx-2">
                {f}
              </span>
            ))}
          </Marquee>
        </section>

        {/* Shop Services */}
        <section className="py-14" style={{ background: 'var(--cosmos-scaffold)' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-black mb-1" style={{ color: 'var(--cosmos-text-primary)' }}>Our Shop</h2>
              <p className="text-sm" style={{ color: 'var(--cosmos-text-secondary)' }}>Mbirizi Town Council · Mon–Fri 8am–8pm · Sat 8am–9pm · Sun 10am–6pm</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SHOP.map(s => (
                <div key={s.name} className="cosmos-card group flex items-start gap-4 p-5">
                  <span className="text-3xl flex-shrink-0" style={{ filter: 'drop-shadow(0 0 8px rgba(123,97,255,0.4))' }}>{s.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-sm" style={{ color: 'var(--cosmos-text-primary)' }}>{s.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold flex-shrink-0"
                        style={{ borderColor: 'var(--cosmos-primary)', color: 'var(--cosmos-text-primary)', background: 'rgba(123,97,255,0.1)' }}>{s.badge}</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--cosmos-text-secondary)' }}>{s.desc}</p>
                  </div>
                </div>
              ))}
              {/* Enquire card */}
              <a href="https://wa.me/256775912582?text=Hi! I want to enquire about your services"
                target="_blank" rel="noopener noreferrer"
                className="cosmos-card flex items-center justify-center gap-3 p-5 border-dashed"
                style={{ borderWidth: '2px', borderColor: 'var(--cosmos-divider)' }}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#25d366' }}><path d={WA} /></svg>
                <span className="font-semibold text-sm" style={{ color: 'var(--cosmos-text-primary)' }}>Ask on WhatsApp</span>
              </a>
            </div>
          </div>
        </section>

        {/* OTYA Player */}
        <section className="py-14 border-t relative overflow-hidden" style={{ background: 'var(--cosmos-surface)', borderColor: 'var(--cosmos-divider)' }}>
          <div className="cosmos-stars" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-black mb-1" style={{ color: 'var(--cosmos-text-primary)' }}>Our Software</h2>
              <p className="text-sm" style={{ color: 'var(--cosmos-text-secondary)' }}>Built in Uganda, used across Africa</p>
            </div>
            <div className="cosmos-card overflow-hidden">
              {/* Dark hero strip */}
              <div className="relative p-8 sm:p-10" style={{ background: 'linear-gradient(135deg, rgba(2,2,8,0.9) 0%, rgba(13,13,46,0.9) 100%)' }}>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative flex-shrink-0" style={{ animation: 'cosmos-glow 4s infinite' }}>
                    <div className="absolute inset-0 rounded-[24px] blur-xl opacity-80" style={{ background: 'linear-gradient(135deg, var(--cosmos-primary), var(--cosmos-accent))' }} />
                    <Image src="/played-icon.png" alt="OTYA Player" width={88} height={88}
                      className="relative rounded-[24px]" style={{ display: 'block', border: '2px solid rgba(123,97,255,0.4)' }} unoptimized />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold mb-3 border" style={{ borderColor: 'var(--cosmos-primary)', background: 'rgba(123,97,255,0.1)', color: 'var(--cosmos-text-primary)' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      {`Free · Android · v${appVersion}`}
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: 'var(--cosmos-text-primary)' }}>OTYA Player</h3>
                    <p className="text-sm mb-5 max-w-lg mx-auto sm:mx-0" style={{ color: 'var(--cosmos-text-secondary)' }}>A free, offline-first media player for Android. Play music and videos without internet, share files via Flash Share, protect private media in an encrypted Vault, and stream your library to any PC browser on Wi-Fi.</p>
                    <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                      <Link href="/download/otya-player" className="cosmos-button inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-transform">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download Free
                      </Link>
                      <Link href="/otya-player"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border transition-colors"
                        style={{ borderColor: 'var(--cosmos-divider)', color: 'var(--cosmos-text-primary)', background: 'transparent' }}>
                        Learn More
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              {/* Feature pills */}
              <div className="px-6 py-4 flex flex-wrap gap-2 border-t" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-scaffold)' }}>
                {FEATURES.slice(0, 6).map(f => (
                  <span key={f} className="cosmos-pill text-xs px-3 py-1 font-medium">{f}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="py-14 border-t" style={{ background: 'var(--cosmos-scaffold)', borderColor: 'var(--cosmos-divider)' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-black mb-8" style={{ color: 'var(--cosmos-text-primary)' }}>Get in Touch</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { href: 'https://wa.me/256775912582', bg: '#25d366', icon: <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d={WA} /></svg>, label: 'WhatsApp', sub: '+256 775 912 582' },
                { href: 'mailto:support@petersmartlink.com', bg: 'var(--cosmos-secondary)', icon: <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>, label: 'Email', sub: 'support@petersmartlink.com' },
              ].map(c => (
                <a key={c.label} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                  className="cosmos-card flex items-center gap-4 p-5">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: c.bg, boxShadow: `0 4px 15px ${c.bg}40` }}>{c.icon}</div>
                  <div>
                    <div className="font-bold text-sm" style={{ color: 'var(--cosmos-text-primary)' }}>{c.label}</div>
                    <div className="text-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>{c.sub}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}