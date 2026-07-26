import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Terms of Service — OTYA Player | PeterSmart Technologies',
  description: 'Terms of service for OTYA Player by PeterSmart Technologies.',
  alternates: { canonical: 'https://petersmartlink.com/apps/otya-player/terms' },
}

const SECTIONS = [
  { icon: '✅', title: 'Acceptance', body: 'By downloading or using OTYA Player, you agree to these Terms. If you do not agree, please do not use the app.' },
  { icon: '📱', title: 'License', body: 'PeterSmart Technologies grants you a free, limited, non-exclusive license to use OTYA Player for personal use on your Android device.' },
  { icon: '🎵', title: 'Permitted Use', body: 'You may use OTYA Player to play, organise, and manage media files that you own or have the legal right to access.' },
  { icon: '🚫', title: 'Prohibited Use', body: 'Do not reverse engineer, decompile, sell, or use the app for any unlawful purpose or to share copyrighted content without permission.' },
  { icon: '🔒', title: 'Private Vault', body: 'The Vault encrypts your media with AES-256. We cannot recover your Vault PIN. If you lose it, the contents cannot be recovered. Keep your PIN safe.' },
  { icon: '⚠️', title: 'Disclaimer', body: 'OTYA Player is provided as-is without warranties of any kind. We are not responsible for data loss.' },
  { icon: '🇺🇬', title: 'Governing Law', body: 'These Terms are governed by the laws of the Republic of Uganda.' },
  { icon: '📧', title: 'Contact', body: 'support@petersmartlink.com · WhatsApp +256 775 912 582' },
]

export default function OtyaTermsPage() {
  return (
    <div className="min-h-screen relative" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
      <div className="cosmos-stars" />
      <SiteNav />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 relative z-10">
        <div className="mb-10">
          <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--cosmos-text-primary)' }}>Terms of Service</h1>
          <p className="text-sm" style={{ color: 'var(--cosmos-text-secondary)' }}>OTYA Player · com.otyaplayer.app · Last updated: July 2026</p>
        </div>
        <div className="space-y-4">
          {SECTIONS.map(s => (
            <div key={s.title} className="flex gap-4 p-5 rounded-2xl border"
              style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }}>
              <span className="text-2xl flex-shrink-0 mt-0.5">{s.icon}</span>
              <div>
                <h2 className="font-bold text-sm mb-1.5" style={{ color: 'var(--cosmos-text-primary)' }}>{s.title}</h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--cosmos-text-secondary)' }}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-4 text-sm pt-6 border-t" style={{ borderColor: 'var(--cosmos-divider)' }}>
          <a href="/apps/otya-player/privacy" className="font-semibold" style={{ color: 'var(--cosmos-primary)' }}>Privacy Policy</a>
          <a href="/apps/otya-player/support" className="font-semibold" style={{ color: 'var(--cosmos-primary)' }}>Support</a>
          <a href="/download/otya-player" className="font-semibold" style={{ color: 'var(--cosmos-primary)' }}>Download</a>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
