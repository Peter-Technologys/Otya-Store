import type { Metadata } from 'next'
import Link from 'next/link'
import ConnectionsClient from './ConnectionsClient'

export const metadata: Metadata = {
  title: 'Command Center Settings · Otya',
  description: 'Private Otya Command Center settings, connections, approvals and security boundaries.',
  robots: { index: false, follow: false },
}

const sections = [
  ['Intelligence', 'Otya automatically uses the best server-approved model available for the task. There is no administrator model picker and model names stay behind the system boundary.'],
  ['Connections', 'Manage private Otya connections such as Gmail, GitHub, Cloudflare, Firebase and Resend without exposing credentials to public developer apps.'],
  ['Permissions & approvals', 'Choose what Otya may read automatically and what always requires explicit approval before a send, deploy, deletion or other meaningful write.'],
  ['Notifications', 'Control operational alerts, support signals, release warnings and system-health notifications.'],
  ['Security & 2FA', 'Manage administrator sessions, two-step verification, recovery and high-risk operation protections.'],
  ['Developer Platform', 'Manage the public API, developer applications, OAuth scopes, quotas, SDKs and MCP boundary separately from private Admin intelligence.'],
  ['Audit history', 'Review privileged actions, approvals and important operator activity without recording secret values.'],
  ['Appearance', 'Command Center display preferences. Visual settings never change authorization or tool permissions.'],
]

export default function CommandCenterSettingsPage() {
  return <main className="min-h-screen" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
    <header className="border-b sticky top-0 z-10" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-app-bar)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
        <Link href="/admin/ai" className="text-sm font-semibold">← Otya</Link>
        <span className="otya-muted text-xs">/ Settings</span>
        <div className="ml-auto rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.1em]" style={{ borderColor: 'var(--cosmos-divider)' }}>Private admin</div>
      </div>
    </header>

    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="max-w-2xl">
        <div className="otya-kicker mb-3">Otya Admin</div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-[-.045em]">Conversation first. Power behind it.</h1>
        <p className="mt-4 otya-muted leading-relaxed">The chat is the primary control surface. Otya decides which approved intelligence and tools are appropriate for each request. Settings are for connections, authorization, approval rules and security—not choosing AI models.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-px border rounded-2xl overflow-hidden mt-10" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-divider)' }}>
        {sections.map(([title, text]) => <section key={title} className="p-5 sm:p-6" style={{ background: 'var(--cosmos-card)' }}>
          <h2 className="font-bold text-sm">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed otya-muted">{text}</p>
        </section>)}
      </div>

      <ConnectionsClient />

      <div className="mt-10 border rounded-2xl p-5 sm:p-6" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-surface)' }}>
        <div className="otya-kicker mb-2">Action rule</div>
        <h2 className="text-xl font-bold">Read naturally. Act through the chat. Confirm risky writes.</h2>
        <p className="mt-2 text-sm leading-relaxed otya-muted max-w-3xl">Diagnostics, summaries and safe reads may run automatically when authorized. When you ask Otya to send, publish, deploy, delete or change production state, the conversation should prepare the exact action and request approval only when the action meaningfully affects an external system.</p>
      </div>
    </div>
  </main>
}
