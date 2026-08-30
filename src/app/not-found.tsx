import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Page not found | Otya' }

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center otya-ambient" style={{ color: 'var(--cosmos-text-primary)' }}>
      <Link href="/" className="flex items-center gap-2.5 mb-10" aria-label="Otya home">
        <Image src="/otya-icon.svg" alt="Otya" width={42} height={42} className="object-contain" />
        <div className="font-extrabold text-lg tracking-tight">Otya</div>
      </Link>
      <div className="text-7xl sm:text-8xl font-black mb-4" style={{ color: 'var(--cosmos-primary)' }}>404</div>
      <h1 className="text-2xl font-extrabold mb-3">That page moved.</h1>
      <p className="text-sm max-w-sm mb-8 otya-muted">Go back to music, ask Otya, or open Help.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/music" className="cosmos-button px-6 py-3 rounded-full font-bold">Music</Link>
        <Link href="/help" className="otya-quiet-button px-6 py-3 rounded-full font-bold">Help</Link>
      </div>
    </div>
  )
}
