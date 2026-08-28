'use client'

import { FormEvent, useState } from 'react'

export function OtyaAssistPrompt() {
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const q = query.trim()
    if (!q || loading) return
    setLoading(true)
    setAnswer(null)
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: q, surface: 'support-inline' }),
      })
      if (!response.ok) throw new Error('unavailable')
      const data = await response.json() as { answer?: string; response?: string; message?: string }
      setAnswer(data.answer || data.response || data.message || 'OTYA could not answer that yet.')
    } catch {
      setAnswer('Online help is unavailable right now. OTYA support pages and the Android app still work without AI.')
    } finally {
      setLoading(false)
    }
  }

  return <div className="border-y py-6" style={{ borderColor: 'var(--cosmos-divider)' }}>
    <div className="otya-kicker mb-2">Ask OTYA</div>
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search help or ask a question"
        className="min-w-0 flex-1 rounded-xl border px-4 py-3 text-sm outline-none"
        style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-surface)', color: 'var(--cosmos-text-primary)' }}
      />
      <button disabled={loading || !query.trim()} className="cosmos-button rounded-xl px-5 py-3 text-sm font-bold disabled:opacity-50">
        {loading ? 'Checking…' : 'Ask'}
      </button>
    </form>
    {answer && <div className="mt-4 text-sm leading-relaxed otya-muted max-w-3xl" aria-live="polite">{answer}</div>}
  </div>
}
