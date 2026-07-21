import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - Otya Player | PeterSmart Technologies',
  description: 'Privacy policy for Otya Player offline media player app.',
  alternates: { canonical: 'https://petersmartlink.com/apps/played/privacy/' },
}

export default function PlayedPrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0d0d2b] to-[#1a0a2e]">
      <nav className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl bg-black/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-white text-sm">Home</Link>
          <span className="text-slate-600">/</span>
          <Link href="/apps/played" className="text-slate-400 hover:text-white text-sm">Otya Player</Link>
          <span className="text-slate-600">/</span>
          <span className="text-white text-sm font-medium">Privacy Policy</span>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Privacy Policy</h1>
        <p className="text-slate-400 text-sm mb-10">Last updated: June 2026 - PeterSmart Technologies</p>
        <div className="space-y-6 text-slate-300">
          <section className="rounded-2xl border border-green-500/20 bg-green-500/10 p-6">
            <h2 className="text-lg font-bold text-white mb-3">Overview</h2>
            <p className="text-sm leading-relaxed">Otya Player is <strong className="text-white">offline-first</strong>. <strong className="text-white">We do not collect any personal data.</strong> All data stays on your device.</p>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-bold text-white mb-3">Third-Party Services</h2>
            <p className="text-sm leading-relaxed">lyrics.ovh (song title/artist only), Google Mobile Ads (standard ad identifiers), Appwrite Cloud (optional - email only if you sign in).</p>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-bold text-white mb-3">Contact</h2>
            <p className="text-sm"><a href="mailto:support@petersmartlink.com" className="text-purple-400">support@petersmartlink.com</a> or <a href="https://wa.me/256775912582" className="text-green-400">WhatsApp</a></p>
          </section>
        </div>
        <div className="mt-10 text-center">
          <Link href="/apps/played" className="text-sm text-slate-500 hover:text-white">Back to Otya Player</Link>
        </div>
      </div>
    </div>
  )
}
