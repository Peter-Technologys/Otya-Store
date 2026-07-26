import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Privacy Policy — OTYA Player | PeterSmart Technologies',
  description: 'Privacy policy for OTYA Player. We do not collect or sell your personal data. All media stays on your device.',
  alternates: { canonical: 'https://petersmartlink.com/apps/otya-player/privacy' },
}

const SECTIONS = [
  { icon: '🟢', title: 'We do not collect your data', body: 'OTYA Player is offline-first. All your music, videos, playlists and settings stay on your device. Nothing is sent to our servers.', highlight: true },
  { icon: '📱', title: 'What stays on your device', body: 'Media file names and metadata, playback history, playlists, equalizer settings, and Vault files (AES-256 encrypted). None of this leaves your phone.' },
  { icon: '🔗', title: 'Third-Party Services', body: 'Google AdMob shows ads (uses standard ad identifiers). lyrics.ovh fetches song lyrics using only the song title and artist name. Appwrite Cloud is used only if you choose to sign in for optional backup. Google Sign-In is optional.' },
  { icon: '🔒', title: 'Private Vault', body: 'Files in the Vault are encrypted with AES-256. We cannot access or recover your Vault PIN. Keep it safe.' },
  { icon: '📧', title: 'Contact', body: 'Questions? Email support@petersmartlink.com or WhatsApp +256 775 912 582.' },
]

export default function OtyaPrivacyPage() {
  return (
    <div className="min-h-screen relative" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
      <div className="cosmos-stars" />
      <SiteNav />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 relative z-10">
        <div className="mb-10">
          <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--cosmos-text-primary)' }}>Privacy Policy</h1>
          <p className="text-sm" style={{ color: 'var(--cosmos-text-secondary)' }}>OTYA Player · com.otyaplayer.app · Last updated: July 2026</p>
        </div>
        <div className="space-y-4">
          {SECTIONS.map(s => (
            <div key={s.title}
              className="flex gap-4 p-5 rounded-2xl border"
              style={{
                background: s.highlight ? 'rgba(34,197,94,0.06)' : 'var(--cosmos-card)',
                borderColor: s.highlight ? 'rgba(34,197,94,0.25)' : 'var(--cosmos-divider)',
              }}>
              <span className="text-2xl flex-shrink-0 mt-0.5">{s.icon}</span>
              <div>
                <h2 className="font-bold text-sm mb-1.5" style={{ color: 'var(--cosmos-text-primary)' }}>{s.title}</h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--cosmos-text-secondary)' }}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-4 text-sm pt-6 border-t" style={{ borderColor: 'var(--cosmos-divider)' }}>
          <a href="/apps/otya-player/terms" className="font-semibold" style={{ color: 'var(--cosmos-primary)' }}>Terms of Service</a>
          <a href="/apps/otya-player/support" className="font-semibold" style={{ color: 'var(--cosmos-primary)' }}>Support</a>
          <a href="/download/otya-player" className="font-semibold" style={{ color: 'var(--cosmos-primary)' }}>Download</a>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
