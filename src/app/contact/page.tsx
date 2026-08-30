import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { OtyaAssistPrompt } from '@/components/OtyaAssistPrompt'

export const metadata: Metadata = {
  title: 'Contact & Support | OTYA',
  description: 'Ask OTYA for help or contact OTYA support by email or Telegram.',
  alternates: { canonical: 'https://petersmartlink.com/contact' },
}

export default function ContactPage() {
  return (
    <div className="min-h-screen relative" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
      <SiteNav />
      <main className="max-w-2xl mx-auto px-5 sm:px-6 py-12 sm:py-16 relative z-10">
        <div className="mb-7">
          <div className="text-xs font-bold tracking-[0.16em] uppercase mb-3" style={{ color: 'var(--cosmos-primary)' }}>OTYA Support</div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2">How can we help?</h1>
          <p className="text-sm" style={{ color: 'var(--cosmos-text-secondary)' }}>Ask OTYA first, then reach official support by email or Telegram if you still need help.</p>
        </div>

        <div className="mb-8"><OtyaAssistPrompt /></div>

        <div className="space-y-3 mb-8">
          <a href="https://t.me/OtyaPlayerBot" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 rounded-2xl border hover:-translate-y-0.5" style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#229ED9' }}><span className="text-white text-lg">➤</span></div>
            <div><div className="font-bold text-sm">Telegram support</div><div className="text-sm" style={{ color: 'var(--cosmos-text-secondary)' }}>@OtyaPlayerBot · private OTYA help</div></div>
          </a>

          <a href="mailto:support@petersmartlink.com?subject=OTYA Support" className="flex items-center gap-4 p-5 rounded-2xl border hover:-translate-y-0.5" style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,92,246,.12)' }}><span style={{ color: 'var(--cosmos-primary)' }}>✉</span></div>
            <div><div className="font-bold text-sm">Email support</div><div className="text-sm" style={{ color: 'var(--cosmos-text-secondary)' }}>support@petersmartlink.com</div></div>
          </a>

          <a href="https://t.me/otyaplayer" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 rounded-2xl border hover:-translate-y-0.5" style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,158,217,.12)' }}><span style={{ color: '#229ED9' }}>●</span></div>
            <div><div className="font-bold text-sm">Official OTYA updates</div><div className="text-sm" style={{ color: 'var(--cosmos-text-secondary)' }}>@otyaplayer · releases, notices and announcements</div></div>
          </a>
        </div>

        <section className="rounded-2xl border p-5" style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }}>
          <h2 className="font-bold text-sm mb-2">Before sending a bug report</h2>
          <p className="text-sm" style={{ color: 'var(--cosmos-text-secondary)' }}>Include your OTYA version, phone model, Android version and what happened. Never send your password, OTP, recovery codes or secret keys.</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
