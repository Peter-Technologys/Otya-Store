'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

type InboxEmail = {
  id: string
  from: string
  from_email: string
  subject: string
  created_at: string
  attachments: { id: string; filename: string; content_type: string; size?: number | null }[]
}

type EmailDetail = InboxEmail & {
  text: string
  message_id: string
  reply_to: string[]
}

type Draft = {
  reply: string
  risk: 'low' | 'medium' | 'high'
  reason: string
  category: string
  requires_human: boolean
}

type AuditRow = {
  id: number
  received_email_id: string | null
  sender_email: string | null
  subject: string | null
  action: string
  risk: string | null
  resend_email_id: string | null
  created_at: string
}

function fmt(value: string) {
  try { return new Date(value).toLocaleString() } catch { return value }
}

export default function OtyaAiAdminPage() {
  const [token, setToken] = useState('')
  const [tokenInput, setTokenInput] = useState('')
  const [inbox, setInbox] = useState<InboxEmail[]>([])
  const [selected, setSelected] = useState<EmailDetail | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [reply, setReply] = useState('')
  const [instruction, setInstruction] = useState('')
  const [summary, setSummary] = useState('')
  const [audit, setAudit] = useState<AuditRow[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const saved = sessionStorage.getItem('otya_admin_token') || ''
    if (saved) { setToken(saved); setTokenInput(saved) }
  }, [])

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }), [token])

  const request = useCallback(async (url: string, init?: RequestInit) => {
    const response = await fetch(url, { ...init, headers: { ...headers, ...(init?.headers || {}) } })
    const data = await response.json().catch(() => ({}))
    if (response.status === 401) {
      sessionStorage.removeItem('otya_admin_token')
      setToken('')
      throw new Error('Admin session rejected. Enter the admin token again.')
    }
    if (!response.ok) throw new Error(data.detail || data.error || `HTTP ${response.status}`)
    return data
  }, [headers])

  const loadInbox = useCallback(async () => {
    if (!token) return
    setBusy(true); setMessage('')
    try {
      const data = await request('/api/admin/ai/support/inbox?limit=30')
      setInbox(data.emails || [])
      const log = await request('/api/admin/ai/support/audit?limit=30')
      setAudit(log.audit || [])
    } catch (error) {
      setMessage((error as Error).message)
    } finally { setBusy(false) }
  }, [request, token])

  useEffect(() => { if (token) loadInbox() }, [token, loadInbox])

  function login(event: React.FormEvent) {
    event.preventDefault()
    const value = tokenInput.trim()
    if (!value) return
    sessionStorage.setItem('otya_admin_token', value)
    setToken(value)
  }

  async function openEmail(id: string) {
    setBusy(true); setMessage(''); setDraft(null); setReply(''); setInstruction('')
    try {
      const data = await request(`/api/admin/ai/support/email?id=${encodeURIComponent(id)}`)
      setSelected(data.email)
    } catch (error) { setMessage((error as Error).message) }
    finally { setBusy(false) }
  }

  async function summarize() {
    setBusy(true); setMessage('')
    try {
      const data = await request('/api/admin/ai/support/summary?limit=10')
      setSummary(data.summary || 'No summary available.')
    } catch (error) { setMessage((error as Error).message) }
    finally { setBusy(false) }
  }

  async function makeDraft() {
    if (!selected) return
    setBusy(true); setMessage('')
    try {
      const data = await request('/api/admin/ai/support/draft', {
        method: 'POST',
        body: JSON.stringify({ email_id: selected.id, instruction: instruction.trim() || undefined }),
      })
      setDraft(data.draft)
      setReply(data.draft.reply || '')
      setMessage('AI draft ready. Review it before sending.')
      await loadAuditOnly()
    } catch (error) { setMessage((error as Error).message) }
    finally { setBusy(false) }
  }

  async function loadAuditOnly() {
    try {
      const log = await request('/api/admin/ai/support/audit?limit=30')
      setAudit(log.audit || [])
    } catch { /* non-fatal */ }
  }

  async function sendReply() {
    if (!selected || !reply.trim()) return
    const ok = window.confirm(`Send this reply from support@petersmartlink.com to ${selected.from_email}?`)
    if (!ok) return
    setBusy(true); setMessage('')
    try {
      const data = await request('/api/admin/ai/support/send', {
        method: 'POST',
        body: JSON.stringify({ email_id: selected.id, reply: reply.trim(), risk: draft?.risk || 'manual' }),
      })
      setMessage(`Reply sent to ${data.to}.`)
      await loadAuditOnly()
    } catch (error) { setMessage((error as Error).message) }
    finally { setBusy(false) }
  }

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--cosmos-scaffold)' }}>
        <form onSubmit={login} className="w-full max-w-sm rounded-2xl border p-7" style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }}>
          <h1 className="text-2xl font-black" style={{ color: 'var(--cosmos-text-primary)' }}>OTYA AI Console</h1>
          <p className="text-sm mt-2 mb-5" style={{ color: 'var(--cosmos-text-secondary)' }}>Private support assistant. Enter your existing admin token.</p>
          <input type="password" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="Admin token" className="w-full rounded-xl border px-4 py-3" style={{ background: 'var(--cosmos-surface)', borderColor: 'var(--cosmos-divider)', color: 'var(--cosmos-text-primary)' }} />
          <button className="cosmos-button w-full rounded-xl py-3 font-bold mt-4" type="submit">Open AI Console</button>
        </form>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 py-6 md:px-8" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-bold tracking-widest" style={{ color: '#7b61ff' }}>PETERSMART LINK</p>
            <h1 className="text-3xl font-black">OTYA AI Support Console</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--cosmos-text-secondary)' }}>Read support mail, summarize issues, draft personal replies, and send only after approval.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={summarize} disabled={busy} className="rounded-xl border px-4 py-2 text-sm font-bold" style={{ borderColor: 'var(--cosmos-divider)' }}>Summarize inbox</button>
            <button onClick={loadInbox} disabled={busy} className="cosmos-button rounded-xl px-4 py-2 text-sm font-bold">Refresh</button>
            <button onClick={() => { sessionStorage.removeItem('otya_admin_token'); setToken('') }} className="rounded-xl border px-4 py-2 text-sm" style={{ borderColor: 'var(--cosmos-divider)' }}>Lock</button>
          </div>
        </header>

        {message && <div className="mb-4 rounded-xl border px-4 py-3 text-sm" style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }}>{message}</div>}
        {summary && <section className="mb-6 rounded-2xl border p-5" style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }}><h2 className="font-black mb-2">AI inbox briefing</h2><p className="whitespace-pre-wrap text-sm" style={{ color: 'var(--cosmos-text-secondary)' }}>{summary}</p></section>}

        <div className="grid lg:grid-cols-[360px_1fr] gap-5">
          <section className="rounded-2xl border overflow-hidden" style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }}>
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--cosmos-divider)' }}><h2 className="font-black">Support inbox</h2><span className="text-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>{inbox.length} recent</span></div>
            <div className="max-h-[68vh] overflow-auto">
              {inbox.length === 0 && <p className="p-5 text-sm" style={{ color: 'var(--cosmos-text-secondary)' }}>{busy ? 'Loading…' : 'No inbound emails found.'}</p>}
              {inbox.map((email) => (
                <button key={email.id} onClick={() => openEmail(email.id)} className="w-full text-left px-4 py-4 border-b hover:opacity-80" style={{ borderColor: 'var(--cosmos-divider)', background: selected?.id === email.id ? 'rgba(123,97,255,.12)' : 'transparent' }}>
                  <div className="text-sm font-bold truncate">{email.from || email.from_email}</div>
                  <div className="text-sm truncate mt-1">{email.subject || '(no subject)'}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--cosmos-text-secondary)' }}>{fmt(email.created_at)}{email.attachments?.length ? ` · ${email.attachments.length} attachment(s)` : ''}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border p-5 min-h-[520px]" style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }}>
            {!selected ? <div className="h-full flex items-center justify-center text-sm" style={{ color: 'var(--cosmos-text-secondary)' }}>Select a support email to begin.</div> : (
              <div className="space-y-5">
                <div>
                  <div className="text-xs font-bold" style={{ color: 'var(--cosmos-text-secondary)' }}>FROM</div>
                  <div className="font-bold mt-1">{selected.from}</div>
                  <h2 className="text-xl font-black mt-3">{selected.subject || '(no subject)'}</h2>
                  <div className="text-xs mt-1" style={{ color: 'var(--cosmos-text-secondary)' }}>{fmt(selected.created_at)}</div>
                </div>

                <div className="rounded-xl border p-4 max-h-64 overflow-auto whitespace-pre-wrap text-sm" style={{ background: 'var(--cosmos-surface)', borderColor: 'var(--cosmos-divider)' }}>{selected.text || '(No readable plain-text body)'}</div>

                <div>
                  <label className="text-xs font-bold" style={{ color: 'var(--cosmos-text-secondary)' }}>OPTIONAL INSTRUCTION TO AI</label>
                  <input value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="Example: Explain how to update OTYA and keep the reply short" className="w-full mt-2 rounded-xl border px-4 py-3 text-sm" style={{ background: 'var(--cosmos-surface)', borderColor: 'var(--cosmos-divider)', color: 'var(--cosmos-text-primary)' }} />
                  <button onClick={makeDraft} disabled={busy} className="cosmos-button rounded-xl px-4 py-2 font-bold text-sm mt-3">Draft personal reply</button>
                </div>

                {draft && (
                  <div className="rounded-xl border p-4" style={{ borderColor: draft.risk === 'high' ? '#ef4444' : draft.risk === 'medium' ? '#f59e0b' : '#10b981' }}>
                    <div className="flex flex-wrap gap-2 items-center text-xs mb-2"><strong>AI risk: {draft.risk.toUpperCase()}</strong><span>·</span><span>{draft.category}</span>{draft.requires_human && <span>· HUMAN REVIEW REQUIRED</span>}</div>
                    {draft.reason && <p className="text-xs mb-3" style={{ color: 'var(--cosmos-text-secondary)' }}>{draft.reason}</p>}
                  </div>
                )}

                {(draft || reply) && (
                  <div>
                    <label className="text-xs font-bold" style={{ color: 'var(--cosmos-text-secondary)' }}>REPLY — EDIT BEFORE SENDING</label>
                    <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={12} className="w-full mt-2 rounded-xl border px-4 py-3 text-sm" style={{ background: 'var(--cosmos-surface)', borderColor: 'var(--cosmos-divider)', color: 'var(--cosmos-text-primary)' }} />
                    <div className="flex items-center justify-between gap-3 mt-3">
                      <p className="text-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>Sends as OTYA Support &lt;support@petersmartlink.com&gt; through Resend.</p>
                      <button onClick={sendReply} disabled={busy || !reply.trim()} className="rounded-xl px-5 py-2 text-sm font-black bg-emerald-600 text-white disabled:opacity-50">Approve & send</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <section className="mt-6 rounded-2xl border p-5" style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }}>
          <h2 className="font-black mb-3">Support AI audit</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm"><thead><tr className="text-left" style={{ color: 'var(--cosmos-text-secondary)' }}><th className="py-2 pr-4">Time</th><th className="py-2 pr-4">Action</th><th className="py-2 pr-4">Recipient</th><th className="py-2 pr-4">Subject</th><th className="py-2">Risk</th></tr></thead><tbody>{audit.map((row) => <tr key={row.id} className="border-t" style={{ borderColor: 'var(--cosmos-divider)' }}><td className="py-2 pr-4 whitespace-nowrap">{fmt(row.created_at)}</td><td className="py-2 pr-4 font-bold">{row.action}</td><td className="py-2 pr-4">{row.sender_email || '—'}</td><td className="py-2 pr-4">{row.subject || '—'}</td><td className="py-2">{row.risk || '—'}</td></tr>)}</tbody></table>
          </div>
        </section>
      </div>
    </main>
  )
}
