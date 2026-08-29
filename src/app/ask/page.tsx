import type { Metadata } from 'next'
import { OtyaAssistPrompt } from '../../components/OtyaAssistPrompt'

export const metadata: Metadata = {
  title: 'Ask OTYA',
  description: 'Chat with OTYA for general questions and help with OTYA Player.',
}

export default function AskOtyaPage() {
  return <main className="min-h-screen" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
    <div className="otya-shell py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="otya-kicker mb-3">OTYA AI</div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-[-.045em]">Ask naturally. Keep the conversation going.</h1>
        <p className="mt-4 max-w-2xl text-sm sm:text-base leading-relaxed otya-muted">Ask OTYA is for everyday questions as well as OTYA Player help. It is separate from the private administrator Command Center and never has access to admin tools, credentials or private operations.</p>
        <OtyaAssistPrompt />
      </div>
    </div>
  </main>
}
