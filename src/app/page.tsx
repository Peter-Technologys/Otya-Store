import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { OtyaBrandMark } from '@/components/OtyaBrandMark'

export const metadata: Metadata = {
  title: 'PeterSmart Link — Practical software products',
  description: 'PeterSmart Link is the developer and publisher behind Otya Player, Otya Space and Next.',
  keywords: ['PeterSmart Link', 'Otya Player', 'Otya', 'Uganda software developer', 'Android media player'],
  alternates: { canonical: 'https://petersmartlink.com' },
  openGraph: {
    type: 'website',
    url: 'https://petersmartlink.com',
    title: 'PeterSmart Link — Practical software products',
    description: 'The developer and publisher behind Otya Player, Otya Space and Next.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'PeterSmart Link and Otya' }],
  },
}

const foundations = [
  ['One identity', 'Email, Google and connected sign-in methods resolve to one Otya account rather than creating separate product identities.'],
  ['Offline-first where it matters', 'Otya Player keeps core local music and video useful without requiring a cloud connection.'],
  ['Security on the server', 'Roles and privileged operations are authorized by backend policy, not by whether a button happens to be visible.'],
  ['Clear public surfaces', 'Company, products, Space, documentation and status each have a distinct purpose and consistent navigation.'],
] as const

export default function HomePage() {
  return <div className="min-h-screen flex flex-col bg-[color:var(--cosmos-scaffold)] text-[color:var(--cosmos-text-primary)]">
    <SiteNav />
    <main className="flex-1">
      <section className="relative overflow-hidden border-b border-black/[.05] dark:border-white/[.07]">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_12%_10%,rgba(41,121,255,.14),transparent_31%),radial-gradient(circle_at_88%_18%,rgba(255,59,48,.07),transparent_27%),radial-gradient(circle_at_68%_90%,rgba(255,214,10,.09),transparent_25%)]" />
        <div className="otya-shell relative py-16 sm:py-24 lg:py-28 grid lg:grid-cols-[1.02fr_.98fr] gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-black/[.06] dark:border-white/[.08] px-3 py-2 text-xs font-black bg-white/55 dark:bg-white/[.03]">PeterSmart Link · Uganda</div>
            <h1 className="mt-7 max-w-[800px] text-[clamp(50px,8vw,96px)] font-black tracking-[-.075em] leading-[.88]">Technology with a clear purpose.</h1>
            <p className="mt-7 max-w-[700px] text-base sm:text-xl leading-8 otya-muted">PeterSmart Link develops practical software products designed to stay understandable, secure and useful on real devices. Otya is our current product family.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/apps" className="cosmos-button inline-flex min-h-12 items-center rounded-full px-6 text-sm font-black">Explore products</Link>
              <Link href="/company" className="inline-flex min-h-12 items-center rounded-full border border-black/[.08] dark:border-white/[.10] px-5 text-sm font-black bg-white/55 dark:bg-white/[.03]">About PeterSmart Link</Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs otya-muted"><span>Developer & publisher</span><span>Android</span><span>Offline-first product design</span><span>One account environment</span></div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 rounded-full bg-[radial-gradient(circle,rgba(41,121,255,.13),transparent_65%)] blur-2xl" />
            <div className="relative rounded-[34px] border border-black/[.07] dark:border-white/[.09] bg-white/72 dark:bg-white/[.035] p-4 sm:p-5 shadow-[0_30px_90px_rgba(8,11,18,.16)] backdrop-blur-xl">
              <div className="flex items-center justify-between px-2 pb-4"><div><div className="text-xs font-black otya-muted">Featured product</div><div className="mt-1 text-2xl font-black tracking-[-.04em]">Otya Player</div></div><OtyaBrandMark size={48}/></div>
              <Image src="/brand/otya-app-preview.svg" alt="Otya Player Android application preview" width={1200} height={820} priority className="w-full h-auto rounded-[26px]" />
              <div className="pt-5 px-2 pb-1 flex flex-wrap gap-3"><Link href="/otya-player" className="text-sm font-black">View product →</Link><Link href="/download/otya-player" className="text-sm font-black otya-muted">Download</Link></div>
            </div>
          </div>
        </div>
      </section>

      <section className="otya-shell py-14 sm:py-20">
        <div className="grid lg:grid-cols-[.75fr_1.25fr] gap-10 lg:gap-16 items-start">
          <div className="lg:sticky lg:top-24">
            <div className="otya-kicker">How the ecosystem fits together</div>
            <h2 className="mt-3 text-3xl sm:text-5xl font-black tracking-[-.055em]">One organization. Clear product boundaries.</h2>
            <p className="mt-4 text-sm sm:text-base leading-7 otya-muted">PeterSmart Link is the developer. Otya is a product family. Space is the signed-in environment. Admin is a permissioned role inside the same account system.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {foundations.map(([title, text]) => <article key={title} className="rounded-[24px] border border-black/[.06] dark:border-white/[.08] bg-white/70 dark:bg-white/[.025] p-5 sm:p-6 min-h-[190px]">
              <h3 className="text-lg font-black">{title}</h3>
              <p className="mt-3 text-sm leading-6 otya-muted">{text}</p>
            </article>)}
          </div>
        </div>
      </section>

      <section className="border-y border-black/[.05] dark:border-white/[.07] bg-black/[.018] dark:bg-white/[.018]">
        <div className="otya-shell py-14 sm:py-20 grid lg:grid-cols-3 gap-4">
          <Link href="/otya-player" className="rounded-[28px] border border-black/[.06] dark:border-white/[.08] bg-[color:var(--cosmos-surface)] p-7 sm:p-8 min-h-[280px] flex flex-col"><OtyaBrandMark size={44}/><div className="mt-6 text-xs font-black otya-muted">Product</div><h2 className="mt-1 text-2xl font-black">Otya Player</h2><p className="mt-3 text-sm leading-7 otya-muted">Local music and video, background playback, nearby Transfer, Private media and useful tools.</p><span className="mt-auto pt-7 text-sm font-black">Explore →</span></Link>
          <Link href="https://space.petersmartlink.com" className="rounded-[28px] border border-black/[.06] dark:border-white/[.08] bg-[color:var(--cosmos-surface)] p-7 sm:p-8 min-h-[280px] flex flex-col"><div className="h-11 w-11 rounded-2xl grid place-items-center border border-black/[.07] dark:border-white/[.09] font-black">S</div><div className="mt-6 text-xs font-black otya-muted">Signed-in environment</div><h2 className="mt-1 text-2xl font-black">Space</h2><p className="mt-3 text-sm leading-7 otya-muted">Your account, security, devices, connected providers, settings and authorized tools in one place.</p><span className="mt-auto pt-7 text-sm font-black">Open Space →</span></Link>
          <Link href="/ask" className="rounded-[28px] border border-black/[.06] dark:border-white/[.08] bg-[color:var(--cosmos-surface)] p-7 sm:p-8 min-h-[280px] flex flex-col"><OtyaBrandMark ai size={44}/><div className="mt-6 text-xs font-black otya-muted">Assistant</div><h2 className="mt-1 text-2xl font-black">Next</h2><p className="mt-3 text-sm leading-7 otya-muted">Connected help and Otya guidance available through supported web and account surfaces.</p><span className="mt-auto pt-7 text-sm font-black">Open Next →</span></Link>
        </div>
      </section>

      <section className="otya-shell py-14 sm:py-20">
        <div className="rounded-[32px] border border-black/[.06] dark:border-white/[.08] bg-[color:var(--cosmos-surface)] p-7 sm:p-10 lg:p-12 grid lg:grid-cols-[1fr_auto] gap-8 items-center">
          <div><div className="otya-kicker">Resources</div><h2 className="mt-3 text-3xl sm:text-5xl font-black tracking-[-.055em]">Know where to go.</h2><p className="mt-4 max-w-[720px] text-sm sm:text-base leading-7 otya-muted">Use documentation for product guidance, Status for service health, Space for your account and Company for PeterSmart Link information.</p></div>
          <div className="flex flex-wrap lg:flex-col gap-3"><Link href="https://docs.petersmartlink.com" className="cosmos-button inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-black">Documentation</Link><Link href="https://status.petersmartlink.com" className="inline-flex min-h-11 items-center justify-center rounded-full border border-black/[.08] dark:border-white/[.10] px-5 text-sm font-black">Service status</Link></div>
        </div>
      </section>
    </main>
    <SiteFooter />
  </div>
}
