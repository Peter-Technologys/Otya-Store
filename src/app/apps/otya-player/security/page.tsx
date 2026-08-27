import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'OTYA Player Security — Official Reporting & Download Safety',
  description: 'Official OTYA Player security guidance, safe download information and vulnerability reporting instructions from PeterSmart Link.',
  alternates: { canonical: 'https://petersmartlink.com/apps/otya-player/security' },
}

const protections = [
  ['Private source', 'OTYA application and backend source repositories are private production repositories. Public users should use official PeterSmart Link product and download channels.'],
  ['Official APKs only', 'Install OTYA only from the official PeterSmart Link download page. Avoid APKs redistributed by unknown third parties.'],
  ['Server-side secrets', 'Authentication, Resend, Cloudflare and signing secrets remain server-side or in protected secret stores and are never intentionally shipped inside the Android app.'],
  ['Offline-first design', 'Core local playback remains useful without sending a user’s local media library to the backend just to play it.'],
  ['Optional recovery', 'Google Drive recovery is explicit and opt-in. Recovery data is designed for OTYA application state rather than raw music/video files or Safe media.'],
  ['Signed releases', 'Production release builds are created by the controlled GitHub Actions release pipeline and published through the official OTYA release infrastructure.'],
]

export default function SecurityPage() {
  return <div className="min-h-screen flex flex-col" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
    <SiteNav />
    <main className="flex-1">
      <section className="border-b" style={{ borderColor: 'var(--cosmos-divider)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <p className="text-xs uppercase tracking-[.2em] font-semibold mb-4" style={{ color: 'var(--cosmos-primary)' }}>OTYA Player · Security</p>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-5">Official security & trust information.</h1>
          <p className="text-base sm:text-lg leading-relaxed max-w-3xl" style={{ color: 'var(--cosmos-text-secondary)' }}>This page is the public security reference for OTYA Player. It explains where to download the app, how OTYA protects production infrastructure, and how to report a security issue responsibly.</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/download/otya-player" className="cosmos-button px-5 py-3 rounded-xl font-semibold text-sm">Official download</Link>
            <Link href="/apps/otya-player/support" className="px-5 py-3 rounded-xl border font-semibold text-sm" style={{ borderColor: 'var(--cosmos-divider)' }}>Support</Link>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-18">
        <div className="grid sm:grid-cols-2 gap-4">
          {protections.map(([title, body], i) => <div key={title} className="modern-card p-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black mb-5" style={{ background: 'rgba(139,92,246,.10)', color: 'var(--cosmos-primary)' }}>{String(i + 1).padStart(2, '0')}</div>
            <h2 className="font-black text-lg mb-2">{title}</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--cosmos-text-secondary)' }}>{body}</p>
          </div>)}
        </div>
      </section>

      <section className="border-y" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-surface)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 grid md:grid-cols-2 gap-10">
          <div>
            <p className="text-xs uppercase tracking-[.18em] font-semibold mb-3" style={{ color: 'var(--cosmos-primary)' }}>Report a vulnerability</p>
            <h2 className="text-2xl sm:text-3xl font-black mb-4">Please report security issues privately.</h2>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--cosmos-text-secondary)' }}>Do not publish passwords, tokens, OTPs, private user data, signing material, API keys or working exploit details in public comments or social posts.</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--cosmos-text-secondary)' }}>Use the official PeterSmart Link contact/support channel and clearly mark the message as a security report. Include the affected OTYA version, Android/device details, reproducible steps, impact, and sanitized screenshots or logs.</p>
            <div className="mt-6"><Link href="/contact" className="px-5 py-3 rounded-xl border font-semibold text-sm" style={{ borderColor: 'var(--cosmos-divider)' }}>Contact PeterSmart Link</Link></div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[.18em] font-semibold mb-3" style={{ color: 'var(--cosmos-primary)' }}>Verify what you install</p>
            <h2 className="text-2xl sm:text-3xl font-black mb-4">Use only official OTYA channels.</h2>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--cosmos-text-secondary)' }}>
              <p><strong style={{ color: 'var(--cosmos-text-primary)' }}>Product:</strong> petersmartlink.com/otya-player</p>
              <p><strong style={{ color: 'var(--cosmos-text-primary)' }}>Download:</strong> petersmartlink.com/download/otya-player</p>
              <p><strong style={{ color: 'var(--cosmos-text-primary)' }}>Changelog:</strong> petersmartlink.com/apps/otya-player/changelog</p>
              <p><strong style={{ color: 'var(--cosmos-text-primary)' }}>Support:</strong> petersmartlink.com/apps/otya-player/support</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
        <div className="rounded-[24px] border p-6 sm:p-8" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-card)' }}>
          <h2 className="text-xl font-black mb-3">About the private source repositories</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--cosmos-text-secondary)' }}>OTYA Player and OTYA Server source repositories are private and are not the public distribution channel. Authorized collaborators may access source as required for development; customers and visitors should use this website for product information, support, release notes and official downloads.</p>
        </div>
      </section>
    </main>
    <SiteFooter />
  </div>
}
