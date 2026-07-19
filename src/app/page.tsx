import Link from 'next/link'
import type { Metadata } from 'next'
import { Spotlight } from '@/components/aceternity/spotlight'
import { TypewriterEffect } from '@/components/aceternity/typewriter-effect'
import { MovingBorder } from '@/components/aceternity/moving-border'
import { BackgroundBeams } from '@/components/aceternity/background-beams'
import { CardSpotlight } from '@/components/aceternity/card-spotlight'
import { TextGenerateEffect } from '@/components/aceternity/text-generate-effect'
import { AnimatedGradientText } from '@/components/magicui/animated-gradient-text'
import { Marquee } from '@/components/magicui/marquee'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'OTYA Player - Free Offline Media Player for Android | PeterSmart Technologies',
  description: 'OTYA Player is a free offline media player for Android built in Uganda. Play music and videos, share files via Flash Share, protect media in an encrypted Vault, and stream to any PC browser on Wi-Fi.',
}

const WA_PATH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'

function OtyaIcon({ size = 32 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.25, background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 44 44" fill="none"><polygon points="17,12 17,32 36,22" fill="white" /></svg>
    </div>
  )
}

const FEATURES = [
  { emoji: '🎵', name: 'Audio Player', desc: 'MP3, AAC, FLAC, OGG, M4A - background playback - EQ - lyrics - sleep timer - speed control' },
  { emoji: '🎬', name: 'Video Player', desc: 'MP4, MKV, AVI - hardware-accelerated - PiP - gesture controls - subtitles' },
  { emoji: '📁', name: 'My Space', desc: 'Auto-scan library - Songs / Videos / Folders / Playlists tabs - Recently Played' },
  { emoji: '📝', name: 'Playlists', desc: 'Create, rename, delete, shuffle - cloud backup via Appwrite' },
  { emoji: '🔒', name: 'Private Vault', desc: 'AES-256 encryption - biometric unlock - XOR header obfuscation (gallery-proof)' },
  { emoji: '⚡', name: 'Flash Share', desc: 'Pure Dart HTTP P2P file sharing over local Wi-Fi - QR code send/receive - real-time progress' },
  { emoji: '🌐', name: 'Web Mirror', desc: 'Stream phone library to any PC browser on same Wi-Fi - port 8085 - search + download' },
  { emoji: '📊', name: 'Storage Analyzer', desc: 'Ring chart: Videos / Audio / Cache / Other / Free - one-tap cache purge' },
  { emoji: '🎨', name: 'Seasonal Themes', desc: 'Auto-detects Christmas, Halloween, New Year - AMOLED neon dark theme' },
  { emoji: '☁️', name: 'Cloud Backup', desc: 'Google Sign-In via Appwrite OAuth - backup playlists and play history' },
]

const CHANGELOG = [
  { label: 'Flash Share', desc: 'P2P file sharing - no internet needed, pure Dart HTTP server' },
  { label: 'Web Mirror', desc: 'Stream your library to any PC browser on the same Wi-Fi' },
  { label: 'Vault XOR Obfuscation', desc: 'Gallery-proof encryption - files invisible to other apps' },
  { label: 'Storage Analyzer', desc: 'Ring chart + one-tap cache purge' },
]

const SHOP_SERVICES = [
  { emoji: '💳', name: 'Mobile Money', desc: 'MTN & Airtel MoMo deposits, withdrawals, transfers and bill payments.', badge: 'MTN - Airtel' },
  { emoji: '📱', name: 'Phone Sales', desc: 'Latest smartphones, feature phones and accessories at the best prices.', badge: 'In stock' },
  { emoji: '🔧', name: 'Phone Repairs', desc: 'Screen, battery, charging port and software fixes. Same-day service.', badge: 'Same day' },
  { emoji: '💰', name: 'Phone Loans', desc: 'Get a smartphone on loan with easy weekly repayments via Watu Credit.', badge: 'Watu Credit' },
  { emoji: '📦', name: 'Data & Airtime', desc: 'MTN and Airtel data bundles and airtime top-up at competitive rates.', badge: 'Always open' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b backdrop-blur-2xl" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.92)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <OtyaIcon size={32} />
            <div className="hidden sm:block leading-tight">
              <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>OTYA Player</div>
              <div className="text-[10px]" style={{ color: 'var(--text-sub)' }}>by PeterSmart Technologies</div>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-0.5">
            {([['OTYA Player', '/apps/otya-player'], ['Played', '/apps/played/privacy'], ['Blog', '/blog'], ['Contact', '/contact']] as [string, string][]).map(([label, href]) => (
              <Link key={href} href={href} className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-purple-50" style={{ color: 'var(--text-sub)' }}>{label}</Link>
            ))}
          </div>
          <a href="https://getotya.petersmartlink.com/download" target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)' }}>Download APK</a>
        </div>
      </nav>

      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-12 sm:pt-20 sm:pb-16">
          <BackgroundBeams />
          <Spotlight />
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5 border border-purple-200 bg-purple-50 text-purple-700">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />v1.3.0+5 - Free - Android 5.0+
              </div>
              <h1 className="text-5xl sm:text-6xl font-black mb-4 leading-[1.05] tracking-tight" style={{ color: 'var(--text)' }}>
                <AnimatedGradientText>OTYA Player</AnimatedGradientText>
              </h1>
              <p className="text-base font-semibold mb-3" style={{ color: '#8A2BE2' }}>
                <TypewriterEffect words={['Free Offline Media Player', 'Built in Uganda', 'Offline-First Android App', 'Flash Share & Web Mirror']} />
              </p>
              <TextGenerateEffect text="Play your music and videos without internet. Share files device-to-device with Flash Share, protect private media in an encrypted Vault, and stream your library to any PC browser on your Wi-Fi." className="text-base sm:text-lg max-w-xl mx-auto lg:mx-0 mb-8" style={{ color: 'var(--text-sub)' }} />
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <MovingBorder>
                  <a href="https://getotya.petersmartlink.com/download" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm"
                    style={{ background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)', boxShadow: '0 6px 20px rgba(138,43,226,0.35)' }}>Download APK (Free)</a>
                </MovingBorder>
                <a href="https://wa.me/256775912582" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white" style={{ background: '#25d366' }}>WhatsApp Support</a>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 rounded-[40px] blur-3xl opacity-30" style={{ background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)', transform: 'scale(1.1)' }} />
                <div className="relative w-52 h-52 sm:w-64 sm:h-64 rounded-[40px] flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)', boxShadow: '0 24px 64px rgba(138,43,226,0.4)' }}>
                  <svg width="110" height="110" viewBox="0 0 44 44" fill="none"><circle cx="22" cy="22" r="20" fill="rgba(255,255,255,0.12)" /><polygon points="17,12 17,32 36,22" fill="white" /></svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Marquee */}
        <div className="overflow-hidden border-y py-1" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
          <Marquee>
            {['Flash Share', 'Web Mirror', 'Private Vault', 'Storage Analyzer', 'Audio Player', 'Video Player', 'Playlists', 'Cloud Backup', 'Seasonal Themes'].map((label, i) => (
              <span key={i} className="rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap" style={{ borderColor: 'var(--card-border)', color: 'var(--purple)', background: 'var(--card)' }}>{label}</span>
            ))}
          </Marquee>
        </div>

        {/* Stats */}
        <section className="border-b py-10" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              {([{ value: 500, suffix: '+', label: 'Downloads' }, { value: 3, suffix: '+', label: 'Years Building' }, { value: 10, suffix: '+', label: 'Major Features' }, { value: 1, suffix: '', label: 'App, All-in-One' }] as { value: number; suffix: string; label: string }[]).map(({ value, suffix, label }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <span className="text-4xl font-black" style={{ color: 'var(--text)' }}><NumberTicker value={value} suffix={suffix} /></span>
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-sub)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t py-14" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-black" style={{ color: 'var(--text)' }}>Everything you need, offline</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {FEATURES.map(f => (
                <CardSpotlight key={f.name} className="flex items-start gap-3 p-5">
                  <span className="text-2xl flex-shrink-0">{f.emoji}</span>
                  <div>
                    <div className="font-bold text-sm mb-1" style={{ color: 'var(--text)' }}>{f.name}</div>
                    <div className="text-xs leading-relaxed" style={{ color: 'var(--text-sub)' }}>{f.desc}</div>
                  </div>
                </CardSpotlight>
              ))}
            </div>
          </div>
        </section>

        {/* What's New */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-black" style={{ color: 'var(--text)' }}>v1.3.0 Highlights</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {CHANGELOG.map(c => (
              <Card key={c.label}>
                <CardHeader className="p-4 pb-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)' }} />
                    <CardTitle className="text-sm">{c.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-1"><CardDescription className="text-xs">{c.desc}</CardDescription></CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Shop */}
        <section className="border-t py-14" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-black" style={{ color: 'var(--text)' }}>Physical Store Services</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-sub)' }}>Visit us at Mbirizi Town Council, Lwengo District, Uganda</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SHOP_SERVICES.map(s => (
                <div key={s.name} className="flex items-start gap-4 p-5 rounded-2xl border transition-all hover:shadow-md hover:-translate-y-0.5" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
                  <span className="text-2xl flex-shrink-0">{s.emoji}</span>
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

        {/* Download CTA */}
        <section className="border-t py-14" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <div className="flex justify-center mb-6"><OtyaIcon size={80} /></div>
            <h2 className="text-2xl sm:text-3xl font-black mb-3" style={{ color: 'var(--text)' }}>Download OTYA Player - Free</h2>
            <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: 'var(--text-sub)' }}>The best free offline media player for Android. Built in Uganda. No subscription, no internet required.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="https://getotya.petersmartlink.com/download" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-white font-semibold text-sm"
                style={{ background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)', boxShadow: '0 6px 20px rgba(138,43,226,0.35)' }}>Download APK (Free)</a>
              <a href="https://wa.me/256775912582" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm border transition-all hover:border-purple-400"
                style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--card)' }}>WhatsApp Support</a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2.5 mb-3"><OtyaIcon size={36} />
                <div>
                  <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>OTYA Player</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-sub)' }}>by PeterSmart Technologies</div>
                </div>
              </div>
              <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-sub)' }}>Free offline media player for Android. Built in Mbirizi, Uganda.</p>
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Navigation</h4>
              <div className="space-y-2">
                {([['Home', '/'], ['OTYA Player', '/apps/otya-player'], ['Blog', '/blog'], ['Contact', '/contact']] as [string, string][]).map(([l, h]) => (
                  <Link key={l} href={h} className="block text-xs font-medium transition-colors hover:text-purple-600" style={{ color: 'var(--text-sub)' }}>{l}</Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>OTYA Player</h4>
              <div className="space-y-2">
                {([['Privacy Policy', '/apps/otya-player/privacy'], ['Terms of Service', '/apps/otya-player/terms'], ['Support', '/apps/otya-player/support'], ['Changelog', '/apps/otya-player/changelog']] as [string, string][]).map(([l, h]) => (
                  <Link key={l} href={h} className="block text-xs font-medium transition-colors hover:text-purple-600" style={{ color: 'var(--text-sub)' }}>{l}</Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Contact</h4>
              <div className="space-y-2">
                <a href="tel:+256775912582" className="block text-xs font-medium" style={{ color: 'var(--text-sub)' }}>+256 775 912 582</a>
                <a href="mailto:hello@petersmartlink.com" className="block text-xs font-medium" style={{ color: 'var(--text-sub)' }}>hello@petersmartlink.com</a>
                <a href="https://wa.me/256775912582" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold mt-2" style={{ background: '#25d366' }}>WhatsApp Us</a>
              </div>
            </div>
          </div>
          <div className="border-t pt-5 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>&copy; {new Date().getFullYear()} PeterSmart Technologies. All rights reserved.</p>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />Mbirizi, Uganda
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp FAB */}
      <a href="https://wa.me/256775912582" target="_blank" rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-50 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
        style={{ background: '#25d366', width: 52, height: 52, boxShadow: '0 6px 20px rgba(37,211,102,0.4)' }} aria-label="Chat on WhatsApp">
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d={WA_PATH} /></svg>
      </a>
    </div>
  )
}
