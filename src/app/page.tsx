import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PeterSmart Technologies — Mobile Money, Phone Sales & OTYA Player | Mbirizi, Uganda',
  description: 'PeterSmart Technologies is a tech company in Mbirizi, Uganda. We run a mobile money & phone shop and build OTYA Player — a free offline media player for Android.',
  alternates: { canonical: 'https://petersmartlink.com' },
}

const WA = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'

const SHOP = [
  { emoji: '💳', name: 'Mobile Money', desc: 'MTN & Airtel MoMo — deposits, withdrawals, transfers, bill payments.', badge: 'MTN · Airtel' },
  { emoji: '📱', name: 'Phone Sales', desc: 'Latest Android smartphones and accessories at the best prices.', badge: 'In stock' },
  { emoji: '🔧', name: 'Phone Repairs', desc: 'Screen, battery, charging port replacements. Same-day service.', badge: 'Same day' },
  { emoji: '💰', name: 'Phone Loans', desc: 'Get a smartphone on loan via Watu Credit with easy repayments.', badge: 'Watu Credit' },
  { emoji: '📦', name: 'Data & Airtime', desc: 'MTN and Airtel bundles at competitive rates, always available.', badge: 'Always open' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b backdrop-blur-2xl" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.95)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
              <Image src="/web-app-manifest-192x192.png" alt="PeterSmart Link" width={32} height={32} className="w-full h-full object-cover" priority />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>PeterSmart Technologies</div>
              <div className="text-[10px]" style={{ color: 'var(--text-sub)' }}>Mbirizi, Uganda</div>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {([['OTYA Player', '/otya-player'], ['Services', '/services'], ['Blog', '/blog'], ['Contact', '/contact']] as [string, string][]).map(([l, h]) => (
              <Link key={h} href={h} className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-50" style={{ color: 'var(--text-sub)' }}>{l}</Link>
            ))}
          </div>
          <Link href="/otya-player"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-white text-xs font-semibold"
            style={{ background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)' }}>
            <div className="w-5 h-5 rounded-md overflow-hidden flex-shrink-0">
              <Image src="/played-icon.png" alt="OTYA Player" width={20} height={20} className="w-full h-full object-cover" />
            </div>
            <span>OTYA Player</span>
          </Link>
        </div>
      </nav>

      <main className="flex-1">

        {/* Hero — Company */}
        <section className="border-b py-14 sm:py-20" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center gap-10">
              <div className="flex-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4 border" style={{ borderColor: 'var(--border)', color: 'var(--text-sub)', background: 'var(--card)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Est. 2024 · Mbirizi, Uganda
                </div>
                <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight" style={{ color: 'var(--text)' }}>PeterSmart<br />Technologies</h1>
                <p className="text-base leading-relaxed mb-6 max-w-lg" style={{ color: 'var(--text-sub)' }}>
                  A technology company based in Mbirizi Town Council, Lwengo District, Uganda. We run a mobile money and phone shop, and we build software — including <strong style={{ color: 'var(--text)' }}>OTYA Player</strong>, a free offline media player used across Uganda.
                </p>
                <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                  <a href="https://wa.me/256775912582" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ background: '#25d366' }}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d={WA} /></svg>
                    WhatsApp Us
                  </a>
                  <a href="tel:+256775912582"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--card)' }}>
                    📞 Call Us
                  </a>
                </div>
              </div>
              <div className="flex-shrink-0 w-36 h-36 sm:w-44 sm:h-44 rounded-3xl overflow-hidden" style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.12)' }}>
                <Image src="/web-app-manifest-192x192.png" alt="PeterSmart Technologies" width={176} height={176} className="w-full h-full object-cover" priority />
              </div>
            </div>
          </div>
        </section>

        {/* Shop Services */}
        <section className="py-12" style={{ background: 'var(--bg-secondary)' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="mb-6">
              <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--text)' }}>Our Shop</h2>
              <p className="text-sm" style={{ color: 'var(--text-sub)' }}>Mbirizi Town Council, Lwengo District · Open Mon–Sat 8am–8pm, Sun 10am–6pm</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SHOP.map(s => (
                <div key={s.name} className="flex items-start gap-3 p-4 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
                  <span className="text-2xl flex-shrink-0">{s.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{s.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold flex-shrink-0" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>{s.badge}</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-sub)' }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* OTYA Player — product card */}
        <section className="py-12 border-t" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="mb-6">
              <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--text)' }}>Our Software</h2>
              <p className="text-sm" style={{ color: 'var(--text-sub)' }}>Built in Uganda, used across Africa</p>
            </div>
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
              <div className="flex flex-col sm:flex-row items-center gap-6 p-6">
                <div className="w-20 h-20 rounded-[20px] overflow-hidden flex-shrink-0" style={{ boxShadow: '0 8px 32px rgba(138,43,226,0.35)' }}>
                  <Image src="/played-icon.png" alt="OTYA Player" width={80} height={80} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold mb-2 border border-purple-200 bg-purple-50 text-purple-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Free · Android · Latest Update Jan 2027
                  </div>
                  <h3 className="text-xl font-black mb-1" style={{ color: 'var(--text)' }}>OTYA Player</h3>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-sub)' }}>A free, offline-first media player for Android. Play music and videos without internet, share files via Flash Share, protect private media in an encrypted Vault, and stream your library to any PC browser on Wi-Fi.</p>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <Link href="/otya-player"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-semibold text-sm"
                      style={{ background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)' }}>Learn More</Link>
                    <Link href="/download/otya-player"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm border"
                      style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--bg)' }}>Download APK</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="py-12 border-t" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-black mb-6" style={{ color: 'var(--text)' }}>Get in Touch</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <a href="https://wa.me/256775912582" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#25d366' }}>
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d={WA} /></svg>
                </div>
                <div>
                  <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>WhatsApp</div>
                  <div className="text-xs" style={{ color: 'var(--text-sub)' }}>+256 775 912 582</div>
                </div>
              </a>
              <a href="tel:+256775912582"
                className="flex items-center gap-3 p-4 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background: 'var(--bg-tertiary)' }}>📞</div>
                <div>
                  <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>Call</div>
                  <div className="text-xs" style={{ color: 'var(--text-sub)' }}>+256 775 912 582</div>
                </div>
              </a>
              <a href="mailto:hello@petersmartlink.com"
                className="flex items-center gap-3 p-4 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background: 'var(--bg-tertiary)' }}>✉️</div>
                <div>
                  <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>Email</div>
                  <div className="text-xs" style={{ color: 'var(--text-sub)' }}>hello@petersmartlink.com</div>
                </div>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg overflow-hidden"><Image src="/web-app-manifest-192x192.png" alt="PeterSmart" width={28} height={28} className="w-full h-full object-cover" /></div>
                <span className="font-bold text-xs" style={{ color: 'var(--text)' }}>PeterSmart Technologies</span>
              </div>
              <p className="text-xs mb-3" style={{ color: 'var(--text-sub)' }}>Mbirizi Town Council, Lwengo District, Uganda</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>© {new Date().getFullYear()} PeterSmart Technologies</p>
            </div>
            <div>
              <p className="font-bold text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Company</p>
              <div className="space-y-2">
                {([['Home', '/'], ['Services', '/services'], ['Blog', '/blog'], ['Contact', '/contact']] as [string, string][]).map(([l, h]) => (
                  <Link key={l} href={h} className="block text-xs hover:text-purple-600" style={{ color: 'var(--text-sub)' }}>{l}</Link>
                ))}
              </div>
            </div>
            <div>
              <p className="font-bold text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>OTYA Player</p>
              <div className="space-y-2">
                {([['About', '/otya-player'], ['Download', '/download/otya-player'], ['Changelog', '/apps/otya-player/changelog'], ['Support', '/apps/otya-player/support'], ['Privacy', '/apps/otya-player/privacy']] as [string, string][]).map(([l, h]) => (
                  <Link key={l} href={h} className="block text-xs hover:text-purple-600" style={{ color: 'var(--text-sub)' }}>{l}</Link>
                ))}
              </div>
            </div>
            <div>
              <p className="font-bold text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Legal</p>
              <div className="space-y-2">
                {([['Privacy Policy', '/privacy'], ['Terms of Service', '/terms']] as [string, string][]).map(([l, h]) => (
                  <Link key={l} href={h} className="block text-xs hover:text-purple-600" style={{ color: 'var(--text-sub)' }}>{l}</Link>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t pt-4 flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Built in Uganda 🇺🇬</span>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Open now
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp FAB */}
      <a href="https://wa.me/256775912582" target="_blank" rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-50 rounded-full flex items-center justify-center shadow-xl"
        style={{ background: '#25d366', width: 52, height: 52 }} aria-label="WhatsApp">
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d={WA} /></svg>
      </a>
    </div>
  )
}
