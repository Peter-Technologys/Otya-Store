import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Company | PeterSmart Link',
  description: 'PeterSmart Link builds practical software products including Otya Player, Otya Space and Next.',
  alternates: { canonical: 'https://petersmartlink.com/company' },
}

const principles = [
  ['Useful before impressive', 'Products should solve a clear everyday problem before adding complexity.'],
  ['Secure by default', 'Identity, permissions, private data and production operations are protected on the server, not by UI assumptions.'],
  ['Fast on ordinary devices', 'Interfaces should remain responsive on real mobile hardware and variable network conditions.'],
  ['Clear product boundaries', 'PeterSmart Link is the developer organization. Otya is a product family. Space is the signed-in environment.'],
] as const

export default function CompanyPage() {
  return <div className="min-h-screen flex flex-col bg-[color:var(--cosmos-scaffold)] text-[color:var(--cosmos-text-primary)]">
    <SiteNav />
    <main className="flex-1">
      <section className="otya-shell py-16 sm:py-24">
        <div className="max-w-[900px]">
          <div className="otya-kicker">PeterSmart Link</div>
          <h1 className="mt-4 text-[clamp(44px,7vw,84px)] font-black tracking-[-.065em] leading-[.94]">Practical technology, built with care.</h1>
          <p className="mt-6 max-w-[720px] text-base sm:text-xl leading-8 otya-muted">PeterSmart Link is the developer and publisher behind Otya. We build software that aims to stay useful, understandable, secure and dependable on the devices people already use.</p>
        </div>
      </section>

      <section className="border-y border-black/[.05] dark:border-white/[.07] bg-black/[.018] dark:bg-white/[.018]">
        <div className="otya-shell py-14 sm:py-20 grid md:grid-cols-2 gap-4">
          {principles.map(([title, text]) => <article key={title} className="rounded-[26px] border border-black/[.06] dark:border-white/[.08] bg-[color:var(--cosmos-surface)] p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-black tracking-[-.035em]">{title}</h2>
            <p className="mt-3 text-sm sm:text-base leading-7 otya-muted">{text}</p>
          </article>)}
        </div>
      </section>

      <section className="otya-shell py-14 sm:py-20">
        <div className="grid lg:grid-cols-[1fr_.9fr] gap-8 items-start">
          <div>
            <div className="otya-kicker">Based in Uganda</div>
            <h2 className="mt-3 text-3xl sm:text-5xl font-black tracking-[-.055em]">Build locally. Design for real-world use.</h2>
            <p className="mt-4 max-w-[680px] text-sm sm:text-base leading-7 otya-muted">Otya Player is designed around local media, offline use and direct device workflows. Connected services are added where they are useful, without making basic playback depend on the cloud.</p>
          </div>
          <div className="rounded-[28px] border border-black/[.06] dark:border-white/[.08] bg-[color:var(--cosmos-surface)] p-6 sm:p-8">
            <div className="text-sm font-black">PeterSmart Link</div>
            <div className="mt-4 grid gap-3 text-sm">
              <Link href="/apps" className="font-bold">Products →</Link>
              <Link href="/developers" className="font-bold">Developer resources →</Link>
              <Link href="https://docs.petersmartlink.com" className="font-bold">Documentation →</Link>
              <Link href="/contact" className="font-bold">Contact →</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
    <SiteFooter />
  </div>
}
