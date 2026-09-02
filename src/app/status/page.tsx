import type { Metadata } from 'next'
import Link from 'next/link'
import { OtyaBrandMark } from '@/components/OtyaBrandMark'

export const metadata: Metadata = {
  title: 'Otya Status',
  description: 'Safe public availability information for Otya services.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://status.petersmartlink.com' },
}

const publicChecks = [
  {
    title: 'Public edge',
    state: 'Operational',
    detail: 'This page is being served successfully from Otya’s public edge.',
  },
  {
    title: 'Local playback',
    state: 'Device-first',
    detail: 'Local music and video playback are designed to remain useful even when online Otya services are unavailable.',
  },
  {
    title: 'Account & Next',
    state: 'Checked separately',
    detail: 'Account, Next, email and release operations can have availability independent of this public page.',
  },
] as const

export default function StatusPage() {
  return (
    <main className="min-h-screen bg-[color:var(--cosmos-scaffold)] text-[color:var(--cosmos-text-primary)]">
      <div className="mx-auto max-w-[920px] px-5 sm:px-7 py-8 sm:py-12">
        <header className="flex items-center justify-between gap-4">
          <Link href="https://petersmartlink.com" className="inline-flex items-center gap-2" aria-label="Otya home">
            <OtyaBrandMark size={34} />
            <span className="text-lg font-black tracking-[-.04em]">Otya</span>
          </Link>
          <Link
            href="https://petersmartlink.com/help"
            className="inline-flex min-h-10 items-center rounded-full border border-black/[.08] dark:border-white/[.10] px-4 text-sm font-black"
          >
            Help
          </Link>
        </header>

        <section className="pt-14 sm:pt-20">
          <div className="text-[11px] font-black uppercase tracking-[.16em] opacity-60">Public status</div>
          <h1 className="mt-3 text-4xl sm:text-6xl font-black tracking-[-.06em] leading-[.95]">Otya is reachable.</h1>
          <p className="mt-5 max-w-[700px] text-base sm:text-lg leading-8 opacity-70">
            This page reports only safe public information. It never publishes customer data, logs, secrets,
            internal resource names, account identifiers or private diagnostics.
          </p>
        </section>

        <section className="mt-10 grid gap-3 sm:grid-cols-3" aria-label="Public service status">
          {publicChecks.map((check, index) => (
            <article
              key={check.title}
              className="rounded-[24px] border border-black/[.07] dark:border-white/[.09] bg-[color:var(--cosmos-surface)] p-5"
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`h-2.5 w-2.5 rounded-full ${index === 0 ? 'bg-emerald-500' : 'bg-[color:var(--cosmos-primary)]'}`}
                />
                <span className="text-xs font-black uppercase tracking-[.08em] opacity-60">{check.state}</span>
              </div>
              <h2 className="mt-4 text-lg font-black">{check.title}</h2>
              <p className="mt-2 text-sm leading-6 opacity-68">{check.detail}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-[28px] border border-black/[.07] dark:border-white/[.09] bg-black/[.018] dark:bg-white/[.025] p-6 sm:p-7">
          <h2 className="text-xl font-black tracking-[-.025em]">Public checks</h2>
          <p className="mt-2 text-sm leading-6 opacity-68">
            These destinations expose only information intended for customers and can be checked without private admin access.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <Link href="https://petersmartlink.com" className="rounded-2xl bg-[color:var(--cosmos-surface)] px-4 py-3 text-sm font-black">Website</Link>
            <Link href="https://petersmartlink.com/latest" className="rounded-2xl bg-[color:var(--cosmos-surface)] px-4 py-3 text-sm font-black">Release state</Link>
            <Link href="https://docs.petersmartlink.com" className="rounded-2xl bg-[color:var(--cosmos-surface)] px-4 py-3 text-sm font-black">Documentation</Link>
          </div>
        </section>

        <footer className="pt-10 pb-8 text-xs leading-6 opacity-55">
          Account-specific or private operational issues are intentionally not shown here. Use Otya Help for customer support.
        </footer>
      </div>
    </main>
  )
}
