import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '404 - Page Not Found | PeterSmart Link' }

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Link href="/" className="flex items-center gap-2.5 mb-10">
        <Image src="/web-app-manifest-192x192.png" alt="PeterSmart Link" width={40} height={40} className="rounded-xl object-cover shadow-sm" />
        <div className="text-left">
          <div className="font-bold text-sm leading-tight">PeterSmart Link</div>
          <div className="text-xs leading-tight" style={{ color: 'var(--text-sub)' }}>by PeterSmart Technologies</div>
        </div>
      </Link>
      <div className="text-8xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">404</div>
      <h1 className="text-2xl font-bold mb-3">Page not found</h1>
      <p className="text-base max-w-sm mb-10" style={{ color: 'var(--text-sub)' }}>The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/" className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/25">Go Home</Link>
        <a href="https://wa.me/256775912582" target="_blank" rel="noopener noreferrer" className="px-8 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold transition-all">WhatsApp Us</a>
      </div>
    </div>
  )
}
