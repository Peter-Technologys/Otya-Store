import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Support - OTYA Player | PeterSmart Technologies',
  description: 'Get help with OTYA Player. FAQs, bug reporting, and contact information.',
  alternates: { canonical: 'https://petersmartlink.com/apps/otya-player/support' },
}

const FAQS = [
  { q: "Why can't OTYA Player find my music or videos?", a: 'Go to Settings > Library > Rescan Library. On Android 11+, the app may need "All Files Access" permission for SD card content.' },
  { q: 'How do I add files to the Vault?', a: 'Go to the Vault tab, unlock it with your PIN or fingerprint, then tap the + button to move files in.' },
  { q: 'I forgot my Vault PIN. Can I recover it?', a: 'No. The Vault PIN is stored only on your device and cannot be recovered. Keep it safe.' },
  { q: 'How does Flash Share work?', a: 'Flash Share sends files directly between two phones over Wi-Fi. No internet required. Both phones must be on the same Wi-Fi network.' },
  { q: 'Which Android versions are supported?', a: 'Android 5.0 and above. Android 9.0+ recommended for best performance.' },
  { q: 'How do I download OTYA Player?', a: 'Visit petersmartlink.com/download/otya-player on your Android phone. The right version for your phone is selected automatically.' },
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
        <p className="text-sm mb-8" style={{ color: 'var(--text-sub)' }}>We are here to help. Reach us on WhatsApp for the fastest response.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <a href="https://wa.me/256775912582?text=Hi! I need help with OTYA Player"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 rounded-2xl border transition-colors hover:border-green-400"
            style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#25d366' }}>
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>WhatsApp</div>
              <div className="text-xs" style={{ color: 'var(--text-sub)' }}>+256 775 912 582 · Fastest response</div>
            </div>
          </a>
          <a href="mailto:support@petersmartlink.com?subject=OTYA Player Support"
            className="flex items-center gap-4 p-5 rounded-2xl border transition-colors hover:border-purple-400"
            style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background: 'var(--bg-tertiary)' }}>✉️</div>
            <div>
              <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>Email</div>
              <div className="text-xs" style={{ color: 'var(--text-sub)' }}>support@petersmartlink.com</div>
            </div>
          </a>
        </div>
        <h2 className="font-bold text-xs uppercase tracking-widest mb-5" style={{ color: 'var(--text-muted)' }}>Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQS.map(faq => (
            <div key={faq.q} className="p-5 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
              <p className="font-semibold text-sm mb-2" style={{ color: 'var(--text)' }}>{faq.q}</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-sub)' }}>{faq.a}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
          <Link href="/apps/otya-player" className="font-semibold" style={{ color: 'var(--purple)' }}>Back to OTYA Player</Link>
          <Link href="/download/otya-player" className="font-semibold" style={{ color: 'var(--purple)' }}>Download OTYA Player</Link>
        </div>
      </div>
    </div>
  )
}
