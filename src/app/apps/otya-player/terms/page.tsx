import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - OTYA Player | PeterSmart Technologies',
  description: 'Terms of service for OTYA Player (com.otyaplayer.app) by PeterSmart Technologies.',
  alternates: { canonical: 'https://petersmartlink.com/apps/otya-player/terms' },
}

const SECTIONS = [
  { title: '1. Acceptance', body: 'By downloading or using OTYA Player, you agree to these Terms. If you do not agree, do not use the app.' },
  { title: '2. License', body: 'PeterSmart Technologies grants you a limited, non-exclusive, non-transferable license to use OTYA Player for personal, non-commercial purposes.' },
  { title: '3. Permitted Use', body: 'You may use OTYA Player to play, organise, and manage media files that you own or have the legal right to access.' },
  { title: '4. Prohibited Use', body: 'You must not reverse engineer, decompile, sell, or use the app for any unlawful purpose or to share copyrighted content without authorisation.' },
  { title: '5. Private Vault', body: 'The Vault encrypts your media with AES-256. PeterSmart Technologies cannot recover your Vault PIN. If you lose access, the contents cannot be recovered.' },
  { title: '6. Disclaimer', body: 'OTYA Player is provided "as is" without warranties of any kind.' },
  { title: '7. Governing Law', body: 'These Terms are governed by the laws of the Republic of Uganda.' },
  { title: '8. Contact', body: 'support@petersmartlink.com - WhatsApp +256 775 912 582' },
]

export default function OtyaTermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0d0d2b] to-[#1a0a2e]">
      <nav className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl bg-black/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-white text-sm">Home</Link>
          <span className="text-slate-600">/</span>
          <Link href="/apps/otya-player" className="text-slate-400 hover:text-white text-sm">OTYA Player</Link>
          <span className="text-slate-600">/</span>
          <span className="text-white text-sm font-medium">Terms of Service</span>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Terms of Service</h1>
        <p className="text-slate-400 text-sm mb-10">Last updated: July 2026 - PeterSmart Technologies</p>
        <div className="space-y-4">
          {SECTIONS.map(s => (
            <div key={s.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-base font-bold text-white mb-2">{s.title}</h2>
              <p className="text-sm leading-relaxed text-slate-300">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm">
          <Link href="/apps/otya-player" className="text-slate-500 hover:text-white">Back to OTYA Player</Link>
          <Link href="/apps/otya-player/privacy" className="text-purple-400 hover:text-purple-300">Privacy Policy</Link>
        </div>
      </div>
    </div>
  )
}
