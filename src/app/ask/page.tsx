import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { OtyaAssistPrompt } from '../../components/OtyaAssistPrompt'

export const metadata: Metadata = {
  title: 'Ask Otya',
  description: 'Ask Otya for help, discovery and everyday questions.',
}

export default function AskOtyaPage() {
  return <div className="h-dvh overflow-hidden flex flex-col otya-ambient" style={{ color:'var(--cosmos-text-primary)' }}>
    <SiteNav />
    <main className="flex-1 min-h-0 px-3 sm:px-5 pb-[82px] md:pb-4 pt-3 sm:pt-4">
      <div className="mx-auto h-full max-w-4xl flex flex-col min-h-0">
        <header className="shrink-0 px-1 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div><div className="otya-kicker">Ask Otya</div><h1 className="text-xl sm:text-2xl font-extrabold tracking-[-.035em] mt-1">What do you want to know?</h1></div>
            <span className="hidden sm:inline text-xs otya-muted">Web assistant</span>
          </div>
        </header>
        <OtyaAssistPrompt compact />
      </div>
    </main>
  </div>
}
