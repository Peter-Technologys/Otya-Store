import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Privacy Policy — OTYA Player | PeterSmart Link',
  description: 'How OTYA Player handles local media and limited technical data used for optional online services.',
  alternates: { canonical: 'https://petersmartlink.com/apps/otya-player/privacy' },
}

const sections = [
  {
    title: 'Your media stays on your device',
    body: 'OTYA is offline-first. Your music, videos, playlists, playback queue, equalizer settings and Vault files are processed locally. We do not upload your personal media library to PeterSmart Link servers as part of normal playback.',
  },
  {
    title: 'Limited technical data',
    body: 'When online features are used, OTYA may send limited technical information such as app version, device model, Android version, locale, a device identifier, push-notification token, update/download events and diagnostic crash information. This helps us deliver updates, notifications, reliability monitoring and support.',
  },
  {
    title: 'Accounts and optional cloud features',
    body: 'If you choose to sign in or use an online backup, sync or account feature, the information required for that feature may be processed by PeterSmart Link backend services. Offline playback does not require an account.',
  },
  {
    title: 'Private Vault',
    body: 'Vault content is encrypted on your device. PeterSmart Link does not receive your Vault files or PIN through normal Vault operation and cannot recover a forgotten Vault PIN for you.',
  },
  {
    title: 'Security and retention',
    body: 'We use reasonable safeguards for backend data and retain operational information only as long as needed for security, reliability, support and service operation. We do not sell your personal information.',
  },
  {
    title: 'Your choices',
    body: 'You can use OTYA for local playback without signing in. Android permissions can be changed from system Settings, and optional notifications or online features can be disabled where the app provides those controls.',
  },
]

export default function OtyaPrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
      <SiteNav />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[.2em] font-semibold mb-4" style={{ color: 'var(--cosmos-primary)' }}>OTYA Player · Privacy</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">Your media is yours.</h1>
          <p className="text-base leading-relaxed max-w-2xl" style={{ color: 'var(--cosmos-text-secondary)' }}>
            OTYA is designed to keep local media local while using only the technical data needed for optional online services and reliable operation.
          </p>
          <p className="text-xs mt-4" style={{ color: 'var(--cosmos-text-secondary)' }}>Package: com.otyaplayer.app · Last updated: 27 August 2026</p>
        </div>

        <div className="space-y-3">
          {sections.map((section, index) => (
            <section key={section.title} className="modern-card p-6 sm:p-7">
              <div className="flex gap-4 items-start">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0" style={{ background: 'rgba(139,92,246,.12)', color: 'var(--cosmos-primary)' }}>
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div>
                  <h2 className="font-bold text-lg mb-2">{section.title}</h2>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--cosmos-text-secondary)' }}>{section.body}</p>
                </div>
              </div>
            </section>
          ))}
        </div>

        <section className="mt-8 p-6 rounded-2xl border" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-surface)' }}>
          <h2 className="font-bold mb-2">Questions about privacy?</h2>
          <p className="text-sm" style={{ color: 'var(--cosmos-text-secondary)' }}>
            Contact <a className="font-semibold" style={{ color: 'var(--cosmos-primary)' }} href="mailto:support@petersmartlink.com">support@petersmartlink.com</a>.
          </p>
        </section>

        <div className="mt-8 flex flex-wrap gap-4 text-sm pt-6 border-t" style={{ borderColor: 'var(--cosmos-divider)' }}>
          <a href="/apps/otya-player/terms" className="font-semibold" style={{ color: 'var(--cosmos-primary)' }}>Terms of Service</a>
          <a href="/apps/otya-player/support" className="font-semibold" style={{ color: 'var(--cosmos-primary)' }}>Support</a>
          <a href="/download/otya-player" className="font-semibold" style={{ color: 'var(--cosmos-primary)' }}>Download OTYA</a>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
