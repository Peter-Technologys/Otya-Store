import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - OTYA Player | PeterSmart Technologies',
  description: 'Privacy policy for OTYA Player (com.otyaplayer.app). OTYA Player is offline-first and does not sell or share your personal data.',
  alternates: { canonical: 'https://petersmartlink.com/apps/otya-player/privacy' },
}

export default function OtyaPrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0d0d2b] to-[#1a0a2e]">
      <nav className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl bg-black/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3 flex-wrap">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors text-sm">Home</Link>
          <span className="text-slate-600">/</span>
          <Link href="/apps/otya-player" className="text-slate-400 hover:text-white transition-colors text-sm">OTYA Player</Link>
          <span className="text-slate-600">/</span>
          <span className="text-white text-sm font-medium">Privacy Policy</span>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Privacy Policy</h1>
          <p className="text-slate-400 text-sm">App: com.otyaplayer.app - Last updated: July 2026 - PeterSmart Technologies</p>
        </div>
        <div className="space-y-6 text-slate-300">
          <section className="rounded-2xl border border-green-500/20 bg-green-500/10 p-6">
            <h2 className="text-lg font-bold text-white mb-3">Overview</h2>
            <p className="text-sm leading-relaxed">OTYA Player is an <strong className="text-white">offline-first</strong> local media player. <strong className="text-white">We do not collect, sell, or share your personal data.</strong> All your media files and preferences stay on your device.</p>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-bold text-white mb-3">Data We Collect</h2>
            <p className="text-sm leading-relaxed">OTYA Player processes media file metadata, playback history, vault files (AES-256 encrypted), playlists, and settings entirely on your device. None of it is transmitted to our servers.</p>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-bold text-white mb-3">Third-Party Services</h2>
            <p className="text-sm leading-relaxed">Google AdMob (ads), lyrics.ovh (song lyrics - title/artist only), Appwrite Cloud (optional backup), Google Sign-In (optional auth), Cloudflare Workers (APK updates - anonymous).</p>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-bold text-white mb-3">Contact</h2>
            <p className="text-sm leading-relaxed">Email: <a href="mailto:support@petersmartlink.com" className="text-purple-400">support@petersmartlink.com</a> - WhatsApp: <a href="https://wa.me/256775912582" className="text-green-400">+256 775 912 582</a></p>
          </section>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm">
          <Link href="/apps/otya-player" className="text-slate-500 hover:text-white transition-colors">Back to OTYA Player</Link>
          <Link href="/apps/otya-player/terms" className="text-purple-400 hover:text-purple-300 transition-colors">Terms of Service</Link>
        </div>
      </div>
    </div>
  )
}
