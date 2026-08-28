import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { AskOtyaSection } from './AskOtyaSection'

export const metadata: Metadata = {
  title: 'Support — OTYA | PeterSmart Link',
  description: 'Get help with OTYA media permissions, playback, transfer, files, private media and tools.',
  alternates: { canonical: 'https://petersmartlink.com/apps/otya-player/support' },
}

const faqs = [
  ['OTYA cannot find my music or videos', 'Open OTYA Settings → Permissions and allow the media access requested by your Android version, then rescan the library. On Android 13 and newer, audio and video permissions are handled separately.'],
  ['The Now Playing notification is missing', 'Allow notifications for OTYA in Android Settings. This permission is used for playback controls, lock-screen controls and background playback status.'],
  ['Music stopped after I left the app', 'Make sure OTYA notifications are allowed and battery restrictions are not forcing the app to stop. If the problem continues, reopen OTYA and resume from Now Playing.'],
  ['How do I add files to Private?', 'Open Me → Private, unlock it with your configured security method, then use the add/import action to move supported files into the protected area.'],
  ['I forgot my Private PIN. Can PeterSmart Link recover it?', 'No. Private media is designed so PeterSmart Link does not receive your local PIN or encrypted media during normal use. Keep a safe backup of important files.'],
  ['How does Transfer work?', 'Open Me → Transfer. Supported local transfers are designed to move files directly between devices over a local connection; mobile data is not required for the file transfer itself.'],
  ['Where do received videos and songs appear?', 'OTYA rescans normal Android media locations and common receive folders. Playable received videos flow into Video and playable songs flow into Music instead of living in a separate media inbox.'],
  ['How do I download the latest OTYA build?', 'Open petersmartlink.com/download/otya-player on your Android phone. The download page shows the current release information.'],
]

export default function OtyaSupportPage() {
  return <div className="min-h-screen flex flex-col" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
    <SiteNav />
    <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-14 sm:py-20">
      <div className="grid lg:grid-cols-[1fr_.7fr] gap-8 items-start mb-10">
        <div>
          <div className="otya-kicker mb-4">OTYA · Support</div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">Find help without leaving OTYA.</h1>
          <p className="text-base leading-relaxed max-w-2xl otya-muted">Search common answers below or ask OTYA for a direct response. AI is optional; the support information remains available without it.</p>
        </div>
        <div className="border-t pt-5" style={{ borderColor: 'var(--cosmos-divider)' }}>
          <div className="otya-kicker mb-3">Contact support</div>
          <a href="mailto:support@petersmartlink.com?subject=OTYA Support" className="block font-bold mb-2" style={{ color: 'var(--cosmos-primary)' }}>support@petersmartlink.com</a>
          <p className="text-sm leading-relaxed otya-muted">For bugs, include your OTYA version, phone model and Android version.</p>
        </div>
      </div>

      <AskOtyaSection />

      <div className="mt-10 space-y-0 border-y" style={{ borderColor: 'var(--cosmos-divider)' }}>
        {faqs.map(([question, answer]) => <section key={question} className="py-6 border-b last:border-b-0" style={{ borderColor: 'var(--cosmos-divider)' }}>
          <h2 className="font-bold text-base mb-2">{question}</h2>
          <p className="text-sm leading-relaxed otya-muted">{answer}</p>
        </section>)}
      </div>

      <div className="mt-8 flex flex-wrap gap-4 text-sm">
        <a href="/download/otya-player" className="font-semibold">Download OTYA →</a>
        <a href="/apps/otya-player/privacy" className="font-semibold">Privacy →</a>
        <a href="/apps/otya-player/terms" className="font-semibold">Terms →</a>
      </div>
    </main>
    <SiteFooter />
  </div>
}
