import Link from 'next/link'
import Image from 'next/image'

const WA = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'

export function SiteFooter() {
  return (
    <footer className="border-t relative overflow-hidden" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-app-bar)' }}>
      {/* Subtle cosmos gradient at the top of the footer */}
      <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(123,97,255,0.05), transparent)' }} />
      <div className="cosmos-stars" style={{ opacity: 0.3 }} />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Image src="/web-app-manifest-192x192.png" alt="PeterSmart Technologies" width={28} height={28} className="rounded-lg border" style={{ display: 'block', borderColor: 'var(--cosmos-divider)' }} />
              <span className="font-bold text-sm" style={{ color: 'var(--cosmos-text-primary)' }}>PeterSmart Technologies</span>
            </div>
            <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--cosmos-text-secondary)' }}>Mbirizi Town Council, Lwengo District, Uganda</p>
            <a href="https://wa.me/256775912582" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-opacity"
              style={{ background: '#25d366' }}>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d={WA} /></svg>
              WhatsApp
            </a>
          </div>

          {/* Company */}
          <div>
            <p className="font-bold text-xs uppercase tracking-widest mb-3" style={{ color: '#4A4A6A' }}>Company</p>
            <div className="space-y-2">
              {([['Home', '/'], ['Services', '/services'], ['Blog', '/blog'], ['Contact', '/contact']] as [string, string][]).map(([l, h]) => (
                <Link key={l} href={h} className="block text-xs transition-colors hover:text-[var(--cosmos-primary)]" 
                  style={{ color: 'var(--cosmos-text-secondary)' }}
                >{l}</Link>
              ))}
            </div>
          </div>

          {/* OTYA Player */}
          <div>
            <p className="font-bold text-xs uppercase tracking-widest mb-3" style={{ color: '#4A4A6A' }}>OTYA Player</p>
            <div className="space-y-2">
              {([['About', '/otya-player'], ['Download', '/download/otya-player'], ['Support', '/apps/otya-player/support'], ['Privacy', '/apps/otya-player/privacy'], ['Terms', '/apps/otya-player/terms']] as [string, string][]).map(([l, h]) => (
                <Link key={l} href={h} className="block text-xs transition-colors hover:text-[var(--cosmos-primary)]"
                  style={{ color: 'var(--cosmos-text-secondary)' }}
                >{l}</Link>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div>
            <p className="font-bold text-xs uppercase tracking-widest mb-3" style={{ color: '#4A4A6A' }}>Legal</p>
            <div className="space-y-2">
              {([['Privacy Policy', '/privacy'], ['Terms of Service', '/terms']] as [string, string][]).map(([l, h]) => (
                <Link key={l} href={h} className="block text-xs transition-colors hover:text-[var(--cosmos-primary)]"
                  style={{ color: 'var(--cosmos-text-secondary)' }}
                >{l}</Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t pt-5 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: 'var(--cosmos-divider)' }}>
          <span className="text-xs" style={{ color: '#4A4A6A' }}>
            © {new Date().getFullYear()} PeterSmart Technologies · <span style={{ color: 'var(--cosmos-accent)' }}>Built in Uganda 🇺🇬</span>
          </span>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#4A4A6A' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Open now
          </div>
        </div>
      </div>

      {/* WhatsApp FAB */}
      <a href="https://wa.me/256775912582" target="_blank" rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-50 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110"
        style={{ background: '#25d366', width: 52, height: 52, boxShadow: '0 8px 24px rgba(37,211,102,0.4)' }} aria-label="WhatsApp">
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d={WA} /></svg>
      </a>
    </footer>
  )
}