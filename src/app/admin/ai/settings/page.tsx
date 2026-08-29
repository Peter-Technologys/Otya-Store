import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Command Center Settings · OTYA',
  description: 'Private OTYA Command Center settings and security boundaries.',
  robots: { index: false, follow: false },
}

const sections = [
  ['AI & models', 'Choose allowed operator models and defaults. Model availability remains server-controlled.'],
  ['Connections', 'Manage private OTYA connections such as Gmail, GitHub, Cloudflare, Firebase and Resend without exposing credentials to public developer apps.'],
  ['Permissions & approvals', 'Review what the operator may read automatically and what always requires explicit approval before a write, send, deploy or destructive action.'],
  ['Notifications', 'Control operational alerts, support signals, release warnings and system-health notifications.'],
  ['Security & 2FA', 'Manage administrator sessions, two-step verification, recovery and high-risk operation protections.'],
  ['Developer Platform', 'Manage the future public API, developer applications, OAuth scopes, quotas, SDKs and MCP boundary separately from Admin AI.'],
  ['Audit history', 'Review privileged actions, approvals and important operator activity without recording secret values.'],
  ['Appearance', 'Command Center display preferences. Visual settings never change authorization or tool permissions.'],
]

export default function CommandCenterSettingsPage() {
  return <main className="min-h-screen" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
    <header className="border-b sticky top-0 z-10" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-app-bar)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
        <Link href="/admin/ai" className="text-sm font-semibold">← Command Center</Link>
        <span className="otya-muted text-xs">/ Settings</span>
        <div className="ml-auto rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.1em]" style={{ borderColor: 'var(--cosmos-divider)' }}>Private admin</div>
      </div>
    </header>

    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="max-w-2xl">
        <div className="otya-kicker mb-3">OTYA Command Center</div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-[-.045em]">Settings should control power, not replace the conversation.</h1>
        <p className="mt-4 otya-muted leading-relaxed">The Command Center stays chat-first. Settings define connections, authorization, approval rules, developer boundaries and security. Secret values are never displayed here as normal configuration text.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-px border rounded-2xl overflow-hidden mt-10" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-divider)' }}>
        {sections.map(([title, text]) => <section key={title} className="p-5 sm:p-6" style={{ background: 'var(--cosmos-card)' }}>
          <h2 className="font-bold text-sm">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed otya-muted">{text}</p>
        </section>)}
      </div>

      <div className="mt-10 border rounded-2xl p-5 sm:p-6" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-surface)' }}>
        <div className="otya-kicker mb-2">Safety rule</div>
        <h2 className="text-xl font-bold">Read automatically. Approve meaningful writes.</h2>
        <p className="mt-2 text-sm leading-relaxed otya-muted max-w-3xl">Health checks, summaries and diagnostics may run automatically when authorized. Sending external messages, changing production configuration, deploying, deleting, rotating credentials or performing other high-impact actions must keep an explicit approval boundary.</p>
      </div>
    </div>
  </main>
}
