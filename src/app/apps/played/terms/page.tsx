import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - OTYA Player | PeterSmart Technologies',
  description: 'Terms of service for OTYA Player offline media player app.',
  alternates: { canonical: 'https://petersmartlink.com/apps/played/terms/' },
}

export default function PlayedTermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0d0d2b] to-[#1a0a2e]">
      <nav className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl bg-black/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-white text-sm">Home</Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400 text-sm">Played</span>
          <span className="text-slate-600">/</span>
          <span className="text-white text-sm font-medium">Terms of Service</span>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Terms of Service</h1>
        <p className="text-slate-400 text-sm mb-10">Last updated: June 2026 - PeterSmart Technologies</p>
        <div className="space-y-4">
          {[['1. Acceptance','By downloading or using OTYA Player, you agree to these Terms.'],['2. License','Limited, non-exclusive, non-transferable license for personal use.'],['3. Permitted Use','Play, organize, and share media files you own or have rights to.'],['4. Prohibited Use','No reverse engineering, unlawful use, or sharing copyrighted content without authorization.'],['5. Vault','AES-256 encrypted. We cannot recover your PIN. Keep it safe.'],['6. Contact','support@petersmartlink.com - WhatsApp +256 775 912 582']].map(([t,b]) => (
            <div key={t} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-base font-bold text-white mb-2">{t}</h2>
              <p className="text-sm leading-relaxed text-slate-300">{b}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/apps/played" className="text-sm text-slate-500 hover:text-white">Back to OTYA Player</Link>
        </div>
      </div>
    </div>
  )
}
