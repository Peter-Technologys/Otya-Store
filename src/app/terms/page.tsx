import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms & Conditions - PeterSmart Link',
  description: 'Terms and conditions for using PeterSmart Link platform.',
}

const SECTIONS = [
  { title: '1. Acceptance of Terms', body: 'By accessing or using PeterSmart Link (petersmartlink.com), you agree to be bound by these Terms and Conditions.' },
  { title: '2. Services', body: 'PeterSmart Technologies provides a technology platform including SmartPOS, a business directory, product marketplace, blog, and mobile money services in Mbirizi, Uganda.' },
  { title: '3. Prohibited Use', body: 'You may not use our platform to list illegal products, publish false content, process fraudulent transactions, or violate any applicable Ugandan law.' },
  { title: '4. Limitation of Liability', body: 'PeterSmart Technologies is not liable for any indirect, incidental or consequential damages arising from your use of our services.' },
  { title: '5. Governing Law', body: 'These terms are governed by the laws of the Republic of Uganda.' },
  { title: '6. Contact', body: 'For questions: hello@petersmartlink.com - WhatsApp +256 775 912 582.' },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <nav className="sticky top-0 z-50 border-b backdrop-blur-xl" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.92)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/web-app-manifest-192x192.png" alt="PeterSmart Link" width={28} height={28} className="rounded-lg" />
            <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>PeterSmart Link</span>
          </Link>
          <span style={{ color: 'var(--border)' }}>/</span>
          <span className="text-sm" style={{ color: 'var(--text-sub)' }}>Terms &amp; Conditions</span>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--text)' }}>Terms &amp; Conditions</h1>
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
          <Link href="/privacy" className="text-purple-600 hover:text-purple-500">Privacy Policy</Link>
          <Link href="/contact" className="text-purple-600 hover:text-purple-500">Contact Us</Link>
          <Link href="/" className="text-purple-600 hover:text-purple-500">Home</Link>
        </div>
      </div>
    </div>
  )
}
