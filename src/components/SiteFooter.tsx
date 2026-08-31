import Link from 'next/link'
import Image from 'next/image'

const GROUPS = [
  { title: 'Otya', links: [['Music','/music'],['Next','/ask'],['Get the app','/download/otya-player']] },
  { title: 'Support', links: [['Help','/help'],['Sign in','/sign-in']] },
  { title: 'Legal', links: [['Privacy','/privacy'],['Terms','/terms']] },
]

export function SiteFooter() {
  return <footer className="mt-16 border-t border-black/[.06] dark:border-white/[.08] bg-black/[.015] dark:bg-white/[.015]">
    <div className="otya-shell py-10 sm:py-12">
      <div className="grid gap-8 sm:grid-cols-[1.25fr_2fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5 w-fit">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-white/70 dark:bg-white/[.06] border border-black/[.06] dark:border-white/[.08]"><Image src="/otya-icon.svg" alt="" width={27} height={27}/></span>
            <span className="font-black text-lg tracking-[-.04em]">Otya</span>
          </Link>
          <p className="mt-3 max-w-[280px] text-sm leading-6 otya-muted">Music on the web. Your own media on Android. Next when you need help.</p>
        </div>
        <div className="grid grid-cols-3 gap-5">
          {GROUPS.map(group => <div key={group.title}><div className="text-[11px] uppercase tracking-[.14em] font-black otya-muted">{group.title}</div><div className="mt-3 grid gap-2.5">{group.links.map(([label,href]) => <Link key={href} href={href} className="text-sm font-semibold hover:underline underline-offset-4">{label}</Link>)}</div></div>)}
        </div>
      </div>
      <div className="mt-10 pt-5 border-t border-black/[.05] dark:border-white/[.06] flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-[11px] otya-muted">
        <span>© {new Date().getFullYear()} Otya</span>
        <span>Built for listeners everywhere, with roots in Uganda.</span>
      </div>
    </div>
  </footer>
}
