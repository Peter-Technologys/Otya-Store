import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { AskOtyaSection } from './AskOtyaSection'

export const metadata: Metadata = {
  title: 'Support — OTYA | PeterSmart Link',
  description:
    'Get help with OTYA media permissions, playback, Transfer, Private, account features and media tools.',
  alternates: { canonical: 'https://petersmartlink.com/apps/otya-player/support' },
}

const faqs = [
  [
    'OTYA cannot find my music or videos',
    'Open OTYA Settings → Permissions and allow the media access requested by your Android version, then rescan the library. On Android 13 and newer, audio and video permissions are handled separately.',
  ],
  [
    'The Now Playing notification is missing',
    'Allow notifications for OTYA in Android Settings. This permission is used for playback controls, lock-screen controls and background playback status.',
  ],
  [
    'Music stopped after I left the app',
    'Make sure OTYA notifications are allowed and Android battery restrictions are not forcing the app to stop. If the problem continues, reopen OTYA and resume from Now Playing.',
  ],
  [
    'How do I use Private?',
    'Open Me → Private and unlock it with your configured device authentication or Private PIN. Supported media moved into Private is stored inside OTYA app-private storage and kept out of the normal media library until you restore it.',
  ],
  [
    'I forgot my Private PIN. Can PeterSmart Link recover it?',
    'No. PeterSmart Link does not receive your local Private PIN during normal use. Keep another safe copy of important files before relying on any privacy or storage feature.',
  ],
  [
    'What is App Lock?',
    'App Lock protects access to OTYA itself using supported device authentication. You can enable or disable it from OTYA Settings → Privacy & device.',
  ],
  [
    'How does Transfer work?',
    'Open Me → Transfer. OTYA moves supported files directly between nearby devices over local Wi-Fi or hotspot using an authenticated local connection. Mobile data is not required for the file transfer itself.',
  ],
  [
    'Where do received videos and songs appear?',
    'OTYA rescans normal Android media locations and common receive folders. Playable received videos flow into Video and playable songs flow into Music instead of living in a separate media inbox.',
  ],
  [
    'Do I need an OTYA Account to play local media?',
    'No. Local Video, Music, library scanning, playback and core tools are designed to work without signing in. An account is used only for supported account, recovery, backup and cloud-assisted features.',
  ],
  [
    'How do I download the latest OTYA build?',
    'Open the official OTYA download page on your Android phone. It shows the current release and selects the supported Android build.',
  ],
]

export default function OtyaSupportPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'var(--cosmos-scaffold)',
        color: 'var(--cosmos-text-primary)',
      }}
    >
      <SiteNav />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-18">
        <div className="grid lg:grid-cols-[1fr_.7fr] gap-8 items-start mb-9">
          <div>
            <div className="otya-kicker mb-4">OTYA · Support</div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-[-.04em] mb-4">
              Find help for OTYA.
            </h1>
            <p className="text-base leading-relaxed max-w-2xl otya-muted">
              Ask OTYA for a conversational answer or browse the common fixes
              below. Your local playback does not depend on the assistant being
              available.
            </p>
          </div>
          <div
            className="border-t pt-5"
            style={{ borderColor: 'var(--cosmos-divider)' }}
          >
            <div className="otya-kicker mb-3">Contact support</div>
            <a
              href="mailto:support@petersmartlink.com?subject=OTYA Support"
              className="block font-bold mb-2"
              style={{ color: 'var(--cosmos-primary)' }}
            >
              support@petersmartlink.com
            </a>
            <p className="text-sm leading-relaxed otya-muted">
              For bugs, include your OTYA version, phone model, Android version
              and what you were doing when the problem happened.
            </p>
          </div>
        </div>

        <AskOtyaSection />

        <div
          className="mt-10 border-y"
          style={{ borderColor: 'var(--cosmos-divider)' }}
        >
          {faqs.map(([question, answer]) => (
            <section
              key={question}
              className="py-5 sm:py-6 border-b last:border-b-0"
              style={{ borderColor: 'var(--cosmos-divider)' }}
            >
              <h2 className="font-bold text-base mb-2">{question}</h2>
              <p className="text-sm leading-relaxed otya-muted">{answer}</p>
            </section>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <a href="/download/otya-player" className="font-semibold">
            Download OTYA →
          </a>
          <a href="/apps/otya-player/privacy" className="font-semibold">
            Privacy →
          </a>
          <a href="/apps/otya-player/terms" className="font-semibold">
            Terms →
          </a>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
