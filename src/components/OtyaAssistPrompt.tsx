'use client'

import { FormEvent, useEffect, useState } from 'react'

export function OtyaAssistPrompt() {
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [guestId, setGuestId] = useState('')
  const [handoffAvailable, setHandoffAvailable] = useState(false)
  const [showHandoff, setShowHandoff] = useState(false)
  const [email, setEmail] = useState('')
  const [handoffStatus, setHandoffStatus] = useState('')

  useEffect(() => {
    let id = localStorage.getItem('otya_ai_guest') || ''
    if (!id) {
      id = crypto.randomUUID() + crypto.randomUUID()
      localStorage.setItem('otya_ai_guest', id)
    }
    setGuestId(id)
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    const q = query.trim()
    if (!q || !guestId || loading) return
    setLoading(true)
    setAnswer(null)
    setHandoffAvailable(false)
    setShowHandoff(false)
    setHandoffStatus('')
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: q, guest_id: guestId, surface: 'support-inline' }),
      })
      const data = await response.json().catch(() => ({})) as { answer?: string; error?: string; handoff_available?: boolean }
      if (!response.ok) throw new Error(data.error || 'unavailable')
      setAnswer(data.answer || 'Ask OTYA could not answer that yet.')
      setHandoffAvailable(Boolean(data.handoff_available))
    } catch {
      setAnswer('Online help is unavailable right now. The OTYA app and support pages still work without AI.')
    } finally {
      setLoading(false)
    }
  }

  async function requestHandoff() {
    if (!query.trim() || !email.trim() || loading) return
    setLoading(true)
    setHandoffStatus('')
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: query.trim(),
          guest_id: guestId,
          surface: 'support-inline',
          request_handoff: true,
          contact_email: email.trim(),
        }),
      })
      const data = await response.json().catch(() => ({})) as { error?: string; ticket?: string; message?: string }
      if (!response.ok) throw new Error(data.error || 'Could not notify support.')
      setHandoffStatus(`${data.message || 'PeterSmart Link support has been notified.'}${data.ticket ? ` Ticket: ${data.ticket}` : ''}`)
      setShowHandoff(false)
      setHandoffAvailable(false)
    } catch (error) {
      setHandoffStatus((error as Error).message || 'Could not notify support. Please email support@petersmartlink.com.')
    } finally {
      setLoading(false)
    }
  }

  return <div className="border-y py-6" style={{ borderColor: 'var(--cosmos-divider)' }}>
    <div className="otya-kicker mb-2">Ask OTYA</div>
    <p className="text-sm otya-muted mb-3">Help with OTYA, playback, files, transfer, account, updates and troubleshooting.</p>
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Ask about OTYA"
        className="min-w-0 flex-1 rounded-xl border px-4 py-3 text-sm outline-none"
        style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-surface)', color: 'var(--cosmos-text-primary)' }}
      />
      <button disabled={loading || !query.trim() || !guestId} className="cosmos-button rounded-xl px-5 py-3 text-sm font-bold disabled:opacity-50">
        {loading ? 'Checking…' : 'Ask'}
      </button>
    </form>

    {answer && <div className="mt-4 text-sm leading-relaxed otya-muted max-w-3xl" aria-live="polite">{answer}</div>}

    {handoffAvailable && !showHandoff && <button type="button" onClick={() => setShowHandoff(true)} className="mt-4 rounded-xl border px-4 py-2.5 text-sm font-semibold" style={{ borderColor: 'var(--cosmos-divider)' }}>Talk to support</button>}

    {showHandoff && <div className="mt-4 max-w-xl rounded-xl border p-4" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-surface)' }}>
      <div className="text-sm font-semibold mb-1">Talk to PeterSmart Link support</div>
      <p className="text-xs otya-muted mb-3">Enter your email so support can reply. Your question will be sent with a ticket number.</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input value={email} onChange={event => setEmail(event.target.value)} type="email" placeholder="Your email" className="min-w-0 flex-1 rounded-xl border px-3 py-2.5 text-sm outline-none" style={{ borderColor: 'var(--cosmos-divider)', background: 'transparent' }} />
        <button type="button" disabled={loading || !email.trim()} onClick={() => void requestHandoff()} className="cosmos-button rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50">Send to support</button>
      </div>
    </div>}

    {handoffStatus && <div className="mt-3 text-sm otya-muted" aria-live="polite">{handoffStatus}</div>}
  </div>
}