import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Changelog - OTYA Player | PeterSmart Technologies',
  description: 'Full version history and changelog for OTYA Player.',
  alternates: { canonical: 'https://petersmartlink.com/apps/otya-player/changelog' },
}

const VERSIONS = [
  { version: '1.3.0', date: 'July 2026', summary: 'Flash Share, Web Mirror, Vault XOR obfuscation, Storage Analyzer, Neon UI overhaul.', changes: [
    { type: 'added', text: 'Flash Share - pure Dart HTTP P2P file sharing over local Wi-Fi' },
    { type: 'added', text: 'Web Mirror - stream phone library to any PC browser on same Wi-Fi' },
    { type: 'added', text: 'Vault XOR header obfuscation - files invisible to gallery scanners' },
    { type: 'added', text: 'Storage Analyzer - ring chart + one-tap cache purge' },
    { type: 'added', text: 'Neon UI Toolkit - AMOLED neon dark theme' },
    { type: 'added', text: 'Seasonal auto-themes: Christmas, Halloween, New Year' },
    { type: 'added', text: 'Auto-update: checks getotya.petersmartlink.com and installs new APK' },
    { type: 'fixed', text: 'Background audio stopping unexpectedly on Android 13+' },
  ]},
  { version: '1.2.0', date: 'February 2026', summary: 'Video player overhaul, Private Vault, equalizer presets.', changes: [
    { type: 'added', text: 'Private Vault - AES-256 encrypted media storage with biometric unlock' },
    { type: 'added', text: 'Video player: hardware-accelerated via media_kit, PiP, gesture controls' },
    { type: 'added', text: '5-band equalizer with presets' },
    { type: 'added', text: 'Car mode, skip silence, WhatsApp Trimmer' },
  ]},
  { version: '1.0.0', date: 'August 2025', summary: 'Initial public release.', changes: [
    { type: 'added', text: 'Audio player: MP3, AAC, FLAC, OGG, M4A' },
    { type: 'added', text: 'Background playback with lock-screen controls' },
    { type: 'added', text: 'Auto-scan device for all audio and video files' },
    { type: 'added', text: 'Dark / AMOLED / Light theme' },
  ]},
]

const TYPE_COLORS: Record<string, string> = { added: '#22c55e', fixed: '#3b82f6', changed: '#f59e0b', removed: '#ef4444' }

export default function OtyaChangelogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0d0d2b] to-[#1a0a2e]">
      <nav className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl bg-black/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-white text-sm">Home</Link>
          <span className="text-slate-600">/</span>
          <Link href="/apps/otya-player" className="text-slate-400 hover:text-white text-sm">OTYA Player</Link>
          <span className="text-slate-600">/</span>
          <span className="text-white text-sm font-medium">Changelog</span>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Changelog</h1>
        <p className="text-slate-400 text-sm mb-12">OTYA Player - com.otyaplayer.app - PeterSmart Technologies</p>
        <div className="space-y-10">
          {VERSIONS.map((v, vi) => (
            <div key={v.version}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl font-black text-white">v{v.version}</span>
                {vi === 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">LATEST</span>}
                <span className="text-sm text-slate-500">{v.date}</span>
              </div>
              {v.summary && <p className="text-sm text-slate-400 mb-4">{v.summary}</p>}
              <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                <ul className="divide-y divide-white/5">
                  {v.changes.map((c, i) => (
                    <li key={i} className="flex items-start gap-3 px-4 py-3">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[7px]" style={{ background: TYPE_COLORS[c.type] || '#8b5cf6' }} />
                      <span className="text-sm text-slate-300">{c.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-4 text-sm">
          <Link href="/apps/otya-player" className="text-slate-500 hover:text-white">Back to OTYA Player</Link>
          <a href="https://getotya.petersmartlink.com/download" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">Download latest APK</a>
        </div>
      </div>
    </div>
  )
}
