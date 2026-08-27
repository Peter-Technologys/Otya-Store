import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Terms of Service — OTYA Player | PeterSmart Link',
  description: 'Terms of service for OTYA Player by PeterSmart Link.',
  alternates: { canonical: 'https://petersmartlink.com/apps/otya-player/terms' },
}

const sections = [
  ['Using OTYA', 'By installing or using OTYA Player, you agree to these Terms. OTYA is provided for lawful personal media playback, organisation and related tools.'],
  ['License', 'PeterSmart Link grants you a limited, non-exclusive, non-transferable licence to use OTYA Player on supported devices. Ownership of the app and its software remains with PeterSmart Link and its licensors.'],
  ['Your content', 'You are responsible for media you play, store, share or process with OTYA and for having the rights or permissions required to use that content.'],
  ['Online services', 'Some features such as updates, notifications, account services, feedback and optional cloud functions may require internet access and may change as the service evolves. Local playback is designed to continue without an account.'],
  ['Vault and local data', 'Security features reduce risk but no software can guarantee absolute protection. Keep your device credentials and Vault PIN secure and maintain backups of important files.'],
  ['Updates and availability', 'We may update, improve, replace or discontinue individual features when needed for security, compatibility, reliability or product development.'],
  ['Prohibited use', 'Do not misuse OTYA to distribute unlawful content, attack systems, bypass security controls, infringe rights, or interfere with other users or PeterSmart Link services.'],
  ['Disclaimer and liability', 'OTYA is provided on an as-available basis to the extent permitted by law. You are responsible for maintaining backups of important media and device data.'],
  ['Governing law', 'These Terms are governed by the laws of the Republic of Uganda, subject to any rights that cannot legally be excluded.'],
]

export default function OtyaTermsPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
      <SiteNav />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[.2em] font-semibold mb-4" style={{ color: 'var(--cosmos-primary)' }}>OTYA Player · Terms</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">Clear terms for a useful player.</h1>
          <p className="text-base leading-relaxed max-w-2xl" style={{ color: 'var(--cosmos-text-secondary)' }}>These terms explain the basic rules for using OTYA Player and its optional online services.</p>
          <p className="text-xs mt-4" style={{ color: 'var(--cosmos-text-secondary)' }}>Package: com.otyaplayer.app · Last updated: 27 August 2026</p>
        </div>

        <div className="space-y-3">
          {sections.map(([title, body], index) => (
            <section key={title} className="modern-card p-6 sm:p-7">
              <div className="flex gap-4 items-start">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0" style={{ background: 'rgba(139,92,246,.12)', color: 'var(--cosmos-primary)' }}>{String(index + 1).padStart(2, '0')}</div>
                <div><h2 className="font-bold text-lg mb-2">{title}</h2><p className="text-sm leading-relaxed" style={{ color: 'var(--cosmos-text-secondary)' }}>{body}</p></div>
              </div>
            </section>
          ))}
        </div>

        <section className="mt-8 p-6 rounded-2xl border" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-surface)' }}>
          <h2 className="font-bold mb-2">Contact</h2>
          <p className="text-sm" style={{ color: 'var(--cosmos-text-secondary)' }}>Questions about these terms can be sent to <a href="mailto:support@petersmartlink.com" className="font-semibold" style={{ color: 'var(--cosmos-primary)' }}>support@petersmartlink.com</a>.</p>
        </section>

        <div className="mt-8 flex flex-wrap gap-4 text-sm pt-6 border-t" style={{ borderColor: 'var(--cosmos-divider)' }}>
          <a href="/apps/otya-player/privacy" className="font-semibold" style={{ color: 'var(--cosmos-primary)' }}>Privacy Policy</a>
          <a href="/apps/otya-player/support" className="font-semibold" style={{ color: 'var(--cosmos-primary)' }}>Support</a>
          <a href="/download/otya-player" className="font-semibold" style={{ color: 'var(--cosmos-primary)' }}>Download OTYA</a>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
