import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Local Services · PeterSmart Link',
  description: 'PeterSmart Link local retail and mobile-money services in Mbirizi, Lwengo District, Uganda. This page is separate from the OTYA software product.',
}

const SERVICES = [
  { id: '1', name: 'Mobile Money — MTN & Airtel', description: 'Deposits, withdrawals, transfers and bill payments. Fast and reliable every day.', price: 0 },
  { id: '2', name: 'Phone Loans', description: 'Ask about currently available smartphone financing options and repayment terms.', price: 0 },
  { id: '3', name: 'Data Bundles & Airtime', description: 'MTN and Airtel data bundles and airtime top-up.', price: 0 },
  { id: '4', name: 'Phones & Accessories', description: 'Smartphones, feature phones, accessories and selected small electronics available locally.', price: 0 },
]

export default function ServicesPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
      <SiteNav />
      <main className="flex-1">
        <section className="border-b" style={{ borderColor: 'var(--cosmos-divider)' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <div className="otya-kicker mb-3">PeterSmart Link · Local business</div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-[-.04em]">Local services in Mbirizi</h1>
            <p className="mt-4 text-sm sm:text-base leading-relaxed max-w-2xl" style={{ color: 'var(--cosmos-text-secondary)' }}>This page covers PeterSmart Link&apos;s in-person retail and mobile-money services. OTYA is our separate Android software product.</p>
            <div className="mt-5 text-sm font-semibold"><Link href="/otya-player">Looking for OTYA Player? →</Link></div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SERVICES.map(s => (
              <div key={s.id} className="p-5 rounded-2xl border transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }}>
                <h2 className="font-bold text-sm mb-2">{s.name}</h2>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--cosmos-text-secondary)' }}>{s.description}</p>
                <a href={`https://wa.me/256775912582?text=Hi! I need: ${encodeURIComponent(s.name)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex text-xs font-semibold px-3 py-2 rounded-lg text-white"
                  style={{ background: '#25d366' }}>Ask about availability</a>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
