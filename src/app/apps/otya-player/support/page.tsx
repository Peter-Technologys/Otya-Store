import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Support - OTYA Player | PeterSmart Link',
  description: 'Get help with OTYA Player. FAQs, bug reporting, and contact information.',
}

const FAQS = [
  { q: "Why can't OTYA Player find my music or videos?", a: 'Go to Settings > Library > Rescan Library. On Android 11+, the app may need "All Files Access" permission for SD card content.' },
  { q: 'How do I add files to the Vault?', a: 'Go to the Vault tab, unlock it with your PIN or biometric, then tap the + button to move files in.' },
  { q: 'I forgot my Vault PIN. Can I recover it?', a: 'No. The Vault PIN is stored only on your device and cannot be recovered by us.' },
  { q: 'How does Air-Drop work?', a: 'Air-Drop uses Wi-Fi Direct and Bluetooth to send files directly between two devices. No internet required.' },
  { q: 'Which Android versions are supported?', a: 'Android 5.0 (API 21) and above. Android 9.0+ recommended.' },
]

export default function OtyaSupportPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <nav className="sticky top-0 z-50 border-b backdrop-blur-2xl" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.92)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-2 text-sm">
          <Link href="/" className="font-medium hover:text-purple-600" style={{ color: 'var(--text-sub)' }}>Home</Link>
          <span style={{ color: 'var(--border)' }}>/</span>
          <Link href="/apps/otya-player" className="font-medium hover:text-purple-600" style={{ color: 'var(--text-sub)' }}>OTYA Player</Link>
          <span style={{ color: 'var(--border)' }}>/</span>
          <span className="font-semibold" style={{ color: 'var(--text)' }}>Support</span>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--text)' }}>OTYA Player Support</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 mt-6">
          <a href="mailto:dev@petersmartlink.com?subject=OTYA Player Support" className="flex items-center gap-4 p-5 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
            <div className="text-2xl">Email Support</div>
            <div className="text-xs" style={{ color: 'var(--text-sub)' }}>dev@petersmartlink.com</div>
          </a>
          <a href="https://wa.me/256775912582?text=Hi! I need help with OTYA Player" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
            <div className="text-2xl">WhatsApp</div>
            <div className="text-xs" style={{ color: 'var(--text-sub)' }}>+256 775 912 582 - Fastest response</div>
          </a>
        </div>
        <h2 className="font-bold text-xs uppercase tracking-widest mb-5" style={{ color: 'var(--text-muted)' }}>Frequently Asked Questions</h2>
        <div className="space-y-4">
          {FAQS.map(faq => (
            <div key={faq.q} className="p-5 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
              <p className="font-semibold text-sm mb-2" style={{ color: 'var(--text)' }}>{faq.q}</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-sub)' }}>{faq.a}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/apps/otya-player" className="text-sm font-semibold" style={{ color: '#8A2BE2' }}>Back to OTYA Player</Link>
        </div>
      </div>
    </div>
  )
}
