import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - PeterSmart Link',
  description: 'Privacy policy for PeterSmart Link and SmartPOS.',
}

const SECTIONS = [
  { title: '1. Who We Are', body: 'PeterSmart Technologies operates PeterSmart Link (petersmartlink.com). We are based in Mbirizi Town Council, Lwengo District, Uganda. Contact: hello@petersmartlink.com' },
  { title: '2. Data We Collect', body: 'We collect: (a) Account data - name, email, phone when you register. (b) Business data - business name, address, products, services, blog posts. (c) Transaction data - sales records. (d) Usage data.' },
  { title: '3. How We Use Your Data', body: 'We use your data to provide and improve our services, display your business on the platform, generate PDF receipts, send account notifications, and comply with Ugandan law.' },
  { title: '4. Data Storage', body: 'Your data is stored on Appwrite Cloud servers in the New York City (NYC) region. We do not sell your data to third parties.' },
  { title: '5. Your Rights', body: 'You have the right to access, correct, delete and export your personal data. Contact us at hello@petersmartlink.com.' },
  { title: '6. Contact', body: 'For privacy questions: hello@petersmartlink.com - WhatsApp +256 775 912 582 - Mbirizi Town Council, Lwengo District, Uganda.' },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <nav className="sticky top-0 z-50 border-b backdrop-blur-xl" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.92)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/web-app-manifest-192x192.png" alt="PeterSmart Link" width={28} height={28} className="rounded-lg" />
            <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>PeterSmart Link</span>
          </Link>
          <span style={{ color: 'var(--border)' }}>/</span>
          <span className="text-sm" style={{ color: 'var(--text-sub)' }}>Privacy Policy</span>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--text)' }}>Privacy Policy</h1>
        <p className="text-sm mb-10" style={{ color: 'var(--text-sub)' }}>Last updated: June 2026 - PeterSmart Technologies</p>
        <div className="space-y-8">
          {SECTIONS.map(s => (
            <div key={s.title}>
              <h2 className="font-semibold text-lg mb-2" style={{ color: 'var(--text)' }}>{s.title}</h2>
              <p className="leading-relaxed" style={{ color: 'var(--text-sub)' }}>{s.body}</p>
            </div>
          ))}
        </div>
        <div className="border-t mt-12 pt-8 flex gap-6 text-sm" style={{ borderColor: 'var(--border)' }}>
          <Link href="/terms" className="text-purple-600 hover:text-purple-500">Terms &amp; Conditions</Link>
          <Link href="/contact" className="text-purple-600 hover:text-purple-500">Contact Us</Link>
          <Link href="/" className="text-purple-600 hover:text-purple-500">Home</Link>
        </div>
      </div>
    </div>
  )
}
