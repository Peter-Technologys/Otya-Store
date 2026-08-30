import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Contact OTYA',
  description: 'Official OTYA support by Ask OTYA, Telegram or email.',
  alternates: { canonical: 'https://petersmartlink.com/contact' },
}

const CONTACTS = [
  { href: '/ask', label: 'Ask OTYA', icon: '✦' },
  { href: 'https://t.me/OtyaPlayerBot', label: 'Telegram', icon: '➤', external: true },
  { href: 'mailto:support@petersmartlink.com?subject=OTYA Support', label: 'Email', icon: '✉' },
]

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
      <SiteNav />
      <main className="flex-1 otya-shell py-12 sm:py-16">
        <div className="max-w-xl mx-auto text-center">
          <div className="otya-kicker mb-3">Support</div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-[-.045em]">Contact OTYA</h1>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {CONTACTS.map(item => (
              <a key={item.label} href={item.href} target={item.external ? '_blank' : undefined} rel={item.external ? 'noopener noreferrer' : undefined} aria-label={item.label} title={item.label} className="aspect-square rounded-2xl border grid place-items-center text-2xl sm:text-3xl transition-transform hover:-translate-y-0.5" style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }}>
                <span aria-hidden="true">{item.icon}</span>
              </a>
            ))}
          </div>
          <p className="mt-5 text-xs otya-muted">Ask OTYA · Telegram · Email</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
