import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = { title: 'Page not found | Otya Player' }

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col otya-ambient" style={{ color: 'var(--cosmos-text-primary)' }}>
      <SiteNav />
      <main className="flex-1 grid place-items-center px-6 py-16 text-center">
        <section className="max-w-lg">
          <Image src="/otya-icon.svg" alt="Otya Player" width={56} height={56} className="mx-auto object-contain" />
          <div className="mt-6 text-7xl sm:text-8xl font-black" style={{ color: 'var(--cosmos-primary)' }}>404</div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-black">That page is not here.</h1>
          <p className="mt-3 text-sm sm:text-base leading-6 otya-muted">Go back to Otya Player, open Help, or ask Next if you were looking for something specific.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className="cosmos-button px-6 py-3 rounded-full font-bold">Home</Link>
            <Link href="/help" className="otya-quiet-button px-6 py-3 rounded-full font-bold">Help</Link>
            <Link href="/ask" className="otya-quiet-button px-6 py-3 rounded-full font-bold">Open Next</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
