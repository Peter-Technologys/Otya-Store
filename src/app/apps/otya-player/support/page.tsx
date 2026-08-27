import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Support — OTYA Player | PeterSmart Link',
  description: 'Get help with OTYA Player, media permissions, playback, downloads and private tools.',
  alternates: { canonical: 'https://petersmartlink.com/apps/otya-player/support' },
}

const faqs = [
  ['OTYA cannot find my music or videos', 'Open OTYA Settings → Permissions and allow the media access requested by your Android version, then use Rescan Library. On Android 13 and newer, audio and video permissions are handled separately.'],
  ['The Now Playing notification is missing', 'Allow notifications for OTYA in Android Settings. This permission is used for playback controls, lock-screen controls and background playback status.'],
  ['Music stopped after I left the app', 'Make sure OTYA notifications are allowed and battery restrictions are not forcing the app to stop. If the problem continues, reopen OTYA and resume from Now Playing.'],
  ['How do I add files to the Vault?', 'Open Vault, unlock it with your configured security method, then use the add/import action to move supported files into the protected area.'],
  ['I forgot my Vault PIN. Can PeterSmart Link recover it?', 'No. The Vault is designed so PeterSmart Link does not receive your local Vault PIN or encrypted media during normal Vault use. Keep a safe backup of important files.'],
  ['How does Flash Share work?', 'Flash Share transfers supported files directly between devices over a local network connection. Internet access is not required for the file transfer itself.'],
  ['How do I download the latest OTYA build?', 'Open petersmartlink.com/download/otya-player on your Android phone. The download page detects the appropriate Android build and shows the current release information.'],
  ['How do I report a bug?', 'Include what you were doing, what you expected, what happened instead, your phone model and Android version. Screenshots are helpful when the issue is visual.'],
]

export default function OtyaSupportPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
      <SiteNav />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="grid lg:grid-cols-[1fr_.7fr] gap-8 items-start mb-12">
          <div>
            <p className="text-xs uppercase tracking-[.2em] font-semibold mb-4" style={{ color: 'var(--cosmos-primary)' }}>OTYA Player · Support</p>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">Get back to playing.</h1>
            <p className="text-base leading-relaxed max-w-2xl" style={{ color: 'var(--cosmos-text-secondary)' }}>Help for media access, playback controls, downloads and OTYA tools without outdated Android permission instructions.</p>
          </div>

          <div className="modern-card p-6">
            <p className="text-xs uppercase tracking-[.16em] font-semibold mb-4" style={{ color: 'var(--cosmos-text-secondary)' }}>Contact support</p>
            <a href="mailto:support@petersmartlink.com?subject=OTYA Player Support" className="block font-bold mb-2" style={{ color: 'var(--cosmos-primary)' }}>support@petersmartlink.com</a>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--cosmos-text-secondary)' }}>For bugs, include your OTYA version, phone model and Android version so we can investigate faster.</p>
          </div>
        </div>

        <div className="space-y-3">
          {faqs.map(([question, answer], index) => (
            <section key={question} className="modern-card p-6 sm:p-7">
              <div className="flex gap-4 items-start">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0" style={{ background: 'rgba(139,92,246,.12)', color: 'var(--cosmos-primary)' }}>{String(index + 1).padStart(2, '0')}</div>
                <div><h2 className="font-bold text-base mb-2">{question}</h2><p className="text-sm leading-relaxed" style={{ color: 'var(--cosmos-text-secondary)' }}>{answer}</p></div>
              </div>
            </section>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-sm pt-6 border-t" style={{ borderColor: 'var(--cosmos-divider)' }}>
          <a href="/download/otya-player" className="font-semibold" style={{ color: 'var(--cosmos-primary)' }}>Download OTYA</a>
          <a href="/apps/otya-player/privacy" className="font-semibold" style={{ color: 'var(--cosmos-primary)' }}>Privacy Policy</a>
          <a href="/apps/otya-player/terms" className="font-semibold" style={{ color: 'var(--cosmos-primary)' }}>Terms of Service</a>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
