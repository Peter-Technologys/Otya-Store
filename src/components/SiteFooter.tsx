import Link from 'next/link'
import Image from 'next/image'

export function SiteFooter() {
  return (
    <footer
      className="border-t"
      style={{
        borderColor: 'var(--cosmos-divider)',
        background: 'var(--cosmos-app-bar)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-7">
        <div className="grid gap-6 md:grid-cols-[1.45fr_1fr_1fr] md:items-start">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image
                src="/web-app-manifest-192x192.png"
                alt="OTYA"
                width={28}
                height={28}
                className="rounded-lg"
              />
              <span className="font-extrabold text-sm">OTYA</span>
            </Link>
            <p
              className="mt-2.5 text-xs leading-relaxed"
              style={{ color: 'var(--cosmos-text-secondary)' }}
            >
              Offline-first video and music for Android, with local Transfer,
              private files, useful tools and Ask OTYA when you want help.
            </p>
          </div>

          <FooterGroup
            title="OTYA"
            links={[
              ['Product', '/otya-player'],
              ['Download', '/download/otya-player'],
              ['Support', '/apps/otya-player/support'],
              ['Changelog', '/apps/otya-player/changelog'],
              ['Developers', '/developers'],
            ]}
          />

          <FooterGroup
            title="Account & legal"
            links={[
              ['Account', '/account'],
              ['Docs', '/docs'],
              ['Privacy', '/privacy'],
              ['Terms', '/terms'],
              ['Contact', '/contact'],
            ]}
          />
        </div>

        <div
          className="mt-6 border-t pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 text-[11px]"
          style={{
            borderColor: 'var(--cosmos-divider)',
            color: 'var(--cosmos-text-secondary)',
          }}
        >
          <span>© {new Date().getFullYear()} OTYA</span>
          <span>Developed by PeterSmart Link · Uganda 🇺🇬</span>
        </div>
      </div>
    </footer>
  )
}

function FooterGroup({
  title,
  links,
}: {
  title: string
  links: string[][]
}) {
  return (
    <div>
      <p
        className="font-bold text-[10px] uppercase tracking-[.12em] mb-2.5"
        style={{ color: 'var(--cosmos-text-secondary)' }}
      >
        {title}
      </p>
      <div className="grid grid-cols-2 md:grid-cols-1 gap-x-4 gap-y-1.5">
        {links.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="text-xs leading-5"
            style={{ color: 'var(--cosmos-text-secondary)' }}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
