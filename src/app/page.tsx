import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'

// Lazy-load all 'use client' animation components so SSR never touches them.
// This prevents the blank white page on Cloudflare Workers / OpenNext.
const Spotlight           = dynamic(() => import('@/components/aceternity/spotlight').then(m => ({ default: m.Spotlight })), { ssr: false })
const TypewriterEffect    = dynamic(() => import('@/components/aceternity/typewriter-effect').then(m => ({ default: m.TypewriterEffect })), { ssr: false })
const MovingBorder        = dynamic(() => import('@/components/aceternity/moving-border').then(m => ({ default: m.MovingBorder })), { ssr: false })
const BackgroundBeams     = dynamic(() => import('@/components/aceternity/background-beams').then(m => ({ default: m.BackgroundBeams })), { ssr: false })
const CardSpotlight       = dynamic(() => import('@/components/aceternity/card-spotlight').then(m => ({ default: m.CardSpotlight })), { ssr: false })
const AnimatedGradientText = dynamic(() => import('@/components/magicui/animated-gradient-text').then(m => ({ default: m.AnimatedGradientText })), { ssr: false })

export const metadata: Metadata = {
  title: 'OTYA Player — Free Offline Media Player for Android',
  description: 'OTYA Player is a free offline media player for Android built in Uganda. Play music and videos, share files via Flash Share, protect media in an encrypted Vault, and stream to any PC browser on Wi-Fi.',
}

const WA_PATH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'

const FEATURES = [
  { emoji: '🎵', name: 'Audio Player', desc: 'MP3, FLAC, AAC — EQ, lyrics, sleep timer, speed control' },
  { emoji: '🎬', name: 'Video Player', desc: 'MKV, AVI, MP4 — hardware-accelerated, PiP, subtitles' },
  { emoji: '📝', name: 'Playlists', desc: 'Create, shuffle, cloud backup via Appwrite' },
  { emoji: '🔒', name: 'Private Vault', desc: 'AES-256 encryption, biometric unlock, gallery-proof' },
  { emoji: '⚡', name: 'Flash Share', desc: 'P2P Wi-Fi file sharing, QR code, real-time progress' },
  { emoji: '🌐', name: 'Web Mirror', desc: 'Stream library to any PC browser on your Wi-Fi' },
]

const CHANGELOG = [
  { label: 'Favorites Tab', desc: 'Heart your songs — dedicated Favorites tab in My Space' },
  { label: 'Recently Added', desc: 'Shelf showing files added in the last 7 days' },
  { label: 'Unified Search', desc: 'Search songs, videos, playlists and folders at once' },
  { label: 'Video Gestures', desc: 'Swipe for brightness & volume with overlay feedback' },
]

const SHOP = [
  { emoji: '💳', name: 'Mobile Money', desc: 'MTN & Airtel MoMo deposits, withdrawals, transfers.', badge: 'MTN · Airtel' },
  { emoji: '📱', name: 'Phone Sales', desc: 'Latest smartphones and accessories at best prices.', badge: 'In stock' },
  { emoji: '🔧', name: 'Phone Repairs', desc: 'Screen, battery, charging port. Same-day service.', badge: 'Same day' },
  { emoji: '💰', name: 'Phone Loans', desc: 'Smartphone on loan via Watu Credit, easy repayments.', badge: 'Watu Credit' },
  { emoji: '📦', name: 'Data & Airtime', desc: 'MTN and Airtel bundles at competitive rates.', badge: 'Always open' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b backdrop-blur-2xl" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.92)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">

          {/* PeterSmart Link brand (left) */}
          <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="PeterSmart Link Home">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
              <Image src="/web-app-manifest-192x192.png" alt="PeterSmart Link" width={32} height={32} className="w-full h-full object-cover" priority />
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="font-bold text-xs" style={{ color: 'var(--text)' }}>PeterSmart Link</div>
              <div className="text-[10px]" style={{ color: 'var(--text-sub)' }}>Mbirizi, Uganda</div>
            </div>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-0.5">
            {([['OTYA Player', '/apps/otya-player'], ['Blog', '/blog'], ['Services', '/services'], ['Contact', '/contact']] as [string, string][]).map(([label, href]) => (
              <Link key={href} href={href} className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-purple-50" style={{ color: 'var(--text-sub)' }}>{label}</Link>
            ))}
          </div>

          {/* OTYA Player CTA (right) with its own logo */}
          <Link href="/download/otya-player" className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-white text-xs font-semibold" style={{ background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)' }}>
            <div className="w-5 h-5 rounded-md overflow-hidden flex-shrink-0">
              <Image src="/played-icon.png" alt="OTYA Player" width={20} height={20} className="w-full h-full object-cover" />
            </div>
            <span className="hidden sm:inline">Download APK</span>
            <span className="sm:hidden">APK</span>
          </Link>
        </div>
      </nav>

      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden" style={{ background: 'var(--bg)' }}>
          <BackgroundBeams />
          <Spotlight />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
            <div className="flex flex-col sm:flex-row items-center gap-8">

              {/* Text */}
              <div className="flex-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 border border-purple-200 bg-purple-50 text-purple-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />v1.4.0+7 · Free · Android 5.0+
                </div>
                <h1 className="text-4xl sm:text-5xl font-black mb-3 leading-tight" style={{ color: 'var(--text)' }}>
                  <AnimatedGradientText>OTYA Player</AnimatedGradientText>
                </h1>
                <p className="text-sm font-semibold mb-2" style={{ color: '#8A2BE2' }}>
                  <TypewriterEffect words={['Free Offline Media Player', 'Built in Uganda', 'Flash Share & Web Mirror', 'Private Vault & EQ']} />
                </p>
                <p className="text-sm leading-relaxed mb-6 max-w-md mx-auto sm:mx-0" style={{ color: 'var(--text-sub)' }}>
                  Play music and videos without internet. Share files device-to-device, protect private media in an encrypted Vault, and stream your library to any PC browser on Wi-Fi.
                </p>
                <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                  <MovingBorder>
                    <Link href="/download/otya-player"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm"
                      style={{ background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)' }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Download APK
                    </Link>
                  </MovingBorder>
                  <a href="https://wa.me/256775912582" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white" style={{ background: '#25d366' }}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d={WA_PATH} /></svg>
                    WhatsApp
                  </a>
                </div>
              </div>

              {/* OTYA Player logo */}
              <div className="flex-shrink-0">
                <div className="relative w-40 h-40 sm:w-52 sm:h-52">
                  <div className="absolute inset-0 rounded-[32px] blur-2xl opacity-40" style={{ background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)' }} />
                  <div className="relative w-full h-full rounded-[32px] overflow-hidden" style={{ boxShadow: '0 20px 60px rgba(138,43,226,0.4)' }}>
                    <Image src="/played-icon.png" alt="OTYA Player App" fill style={{ objectFit: 'cover' }} priority />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="border-t py-10" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-xl font-black mb-6" style={{ color: 'var(--text)' }}>Everything you need, offline</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {FEATURES.map(f => (
                <CardSpotlight key={f.name} className="flex items-start gap-3 p-4">
                  <span className="text-xl flex-shrink-0">{f.emoji}</span>
                  <div>
                    <div className="font-bold text-xs mb-0.5" style={{ color: 'var(--text)' }}>{f.name}</div>
                    <div className="text-xs leading-relaxed" style={{ color: 'var(--text-sub)' }}>{f.desc}</div>
                  </div>
                </CardSpotlight>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link href="/apps/otya-player" className="text-sm font-semibold" style={{ color: 'var(--purple)' }}>See all features →</Link>
            </div>
          </div>
        </section>

        {/* ── v1.3.3 Highlights ── */}
        <section className="py-10" style={{ background: 'var(--bg)' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-xl font-black mb-6" style={{ color: 'var(--text)' }}>v1.4.0 Highlights</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CHANGELOG.map(c => (
                <Card key={c.label}>
                  <CardHeader className="p-3 pb-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)' }} />
                      <CardTitle className="text-xs">{c.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-1"><CardDescription className="text-xs">{c.desc}</CardDescription></CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link href="/apps/otya-player/changelog" className="text-sm font-semibold" style={{ color: 'var(--purple)' }}>Full changelog →</Link>
            </div>
          </div>
        </section>

        {/* ── PeterSmart Link Shop ── */}
        <section className="border-t py-10" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            {/* PeterSmart Link branding header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                <Image src="/web-app-manifest-192x192.png" alt="PeterSmart Link" width={40} height={40} className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-xl font-black" style={{ color: 'var(--text)' }}>PeterSmart Link Shop</h2>
                <p className="text-xs" style={{ color: 'var(--text-sub)' }}>Mbirizi Town Council, Lwengo District, Uganda</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SHOP.map(s => (
                <div key={s.name} className="flex items-start gap-3 p-4 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
                  <span className="text-xl flex-shrink-0">{s.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{s.name}</span>
                      <Badge variant="outline" className="text-[10px] flex-shrink-0">{s.badge}</Badge>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-sub)' }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Download CTA ── */}
        <section className="border-t py-10" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
          <div className="max-w-lg mx-auto px-4 sm:px-6 text-center">
            <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-4" style={{ boxShadow: '0 8px 24px rgba(138,43,226,0.35)' }}>
              <Image src="/played-icon.png" alt="OTYA Player" width={64} height={64} className="w-full h-full object-cover" />
            </div>
            <h2 className="text-xl font-black mb-2" style={{ color: 'var(--text)' }}>Download OTYA Player — Free</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-sub)' }}>No subscription. No internet required. Built in Uganda.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/download/otya-player"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm"
                style={{ background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)' }}>Download APK (Free)</Link>
              <a href="https://wa.me/256775912582" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm border"
                style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--card)' }}>WhatsApp Support</a>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">

            {/* PeterSmart Link brand */}
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg overflow-hidden">
                  <Image src="/web-app-manifest-192x192.png" alt="PeterSmart Link" width={32} height={32} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-bold text-xs" style={{ color: 'var(--text)' }}>PeterSmart Link</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-sub)' }}>Mbirizi, Uganda</div>
                </div>
              </div>
              {/* OTYA Player brand */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg overflow-hidden">
                  <Image src="/played-icon.png" alt="OTYA Player" width={32} height={32} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-bold text-xs" style={{ color: 'var(--text)' }}>OTYA Player</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-sub)' }}>Free Android App</div>
                </div>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-sub)' }}>© {new Date().getFullYear()} PeterSmart Technologies</p>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Navigate</h4>
              <div className="space-y-2">
                {([['Home', '/'], ['OTYA Player', '/apps/otya-player'], ['Blog', '/blog'], ['Contact', '/contact'], ['Services', '/services']] as [string, string][]).map(([l, h]) => (
                  <Link key={l} href={h} className="block text-xs font-medium hover:text-purple-600" style={{ color: 'var(--text-sub)' }}>{l}</Link>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>OTYA Player</h4>
              <div className="space-y-2">
                {([['Download APK', '/download/otya-player'], ['Privacy Policy', '/apps/otya-player/privacy'], ['Terms', '/apps/otya-player/terms'], ['Support', '/apps/otya-player/support'], ['Changelog', '/apps/otya-player/changelog']] as [string, string][]).map(([l, h]) => (
                  <Link key={l} href={h} className="block text-xs font-medium hover:text-purple-600" style={{ color: 'var(--text-sub)' }}>{l}</Link>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Contact</h4>
              <div className="space-y-2">
                <a href="tel:+256775912582" className="block text-xs" style={{ color: 'var(--text-sub)' }}>+256 775 912 582</a>
                <a href="mailto:hello@petersmartlink.com" className="block text-xs" style={{ color: 'var(--text-sub)' }}>hello@petersmartlink.com</a>
                <a href="https://wa.me/256775912582" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-semibold mt-1" style={{ background: '#25d366' }}>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d={WA_PATH} /></svg>
                  WhatsApp
                </a>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-2" style={{ borderColor: 'var(--border)' }}>
            <div className="flex gap-4">
              <Link href="/privacy" className="text-xs" style={{ color: 'var(--text-muted)' }}>Privacy</Link>
              <Link href="/terms" className="text-xs" style={{ color: 'var(--text-muted)' }}>Terms</Link>
            </div>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />Mbirizi, Uganda
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp FAB */}
      <a href="https://wa.me/256775912582" target="_blank" rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-50 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
        style={{ background: '#25d366', width: 48, height: 48 }} aria-label="Chat on WhatsApp">
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d={WA_PATH} /></svg>
      </a>
    </div>
  )
}
