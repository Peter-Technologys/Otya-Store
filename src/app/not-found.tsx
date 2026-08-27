import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '404 - Page Not Found | PeterSmart Link' }

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Link href="/" className="flex items-center gap-2.5 mb-10" aria-label="PeterSmart Link home">
        <Image src="/web-app-manifest-192x192.png" alt="PeterSmart Link" width={40} height={40} className="rounded-xl object-cover" />
        <div className="text-left">
          <div className="font-bold text-sm leading-tight">PeterSmart Link</div>
          <div className="text-[11px] leading-tight" style={{ color: 'var(--text-sub)' }}>Apps • services • technology</div>
        </div>
      </Link>

      <div className="text-8xl font-black mb-4" style={{ color: 'var(--cosmos-primary)' }}>404</div>
      <h1 className="text-2xl font-bold mb-3">Page not found</h1>
      <p className="text-base max-w-sm mb-10" style={{ color: 'var(--text-sub)' }}>
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/" className="cosmos-button px-8 py-3 rounded-xl font-semibold">Go Home</Link>
        <Link href="/contact" className="px-8 py-3 rounded-xl border font-semibold hover:bg-white/5" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
          Contact Support
        </Link>
      </div>
    </div>
  )
}
