'use client'

import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from 'react'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  handoff?: boolean
  failed?: boolean
}

const prompts = [
  'What can OTYA do for me?',
  'How do I send a large video with OTYA Transfer?',
  'Why can a video have picture but no sound?',
  'Help me understand something in simple words.',
]

function OtyaMark({ thinking = false }: { thinking?: boolean }) {
  return <span
    aria-hidden="true"
    className={thinking ? 'inline-flex h-8 w-8 animate-pulse items-center justify-center' : 'inline-flex h-8 w-8 items-center justify-center'}
  >
    <img src="/otya-icon.svg" alt="" className="h-8 w-8" />
  </span>
}

export function OtyaAssistPrompt() {
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [guestId, setGuestId] = useState('')
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

  const lastUserMessage = useMemo(
    () => [...messages].reverse().find(message => message.role === 'user')?.content || '',
    [messages],
  )
  const handoffAvailable = Boolean([...messages].reverse().find(message => message.role === 'assistant')?.handoff)

  async function ask(question: string) {
    const q = question.trim()
    if (!q || !guestId || loading) return

    const history = messages.slice(-20).map(message => ({ role: message.role, content: message.content }))
    setQuery('')
    setLoading(true)
    setShowHandoff(false)
    setHandoffStatus('')
    setMessages(current => [...current, { role: 'user', content: q }])

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: q,
          history,
          guest_id: guestId,
          surface: 'website-chat',
        }),
      })
      const data = await response.json().catch(() => ({})) as {
        answer?: string
        error?: string
        handoff_available?: boolean
      }
      if (!response.ok) throw new Error(data.error || 'unavailable')
      setMessages(current => [...current, {
        role: 'assistant',
        content: data.answer || 'I could not answer that yet. Try asking in another way.',
        handoff: Boolean(data.handoff_available),
      }])
    } catch {
      setMessages(current => [...current, {
        role: 'assistant',
        content: 'I cannot reach the online AI service right now. You can keep using OTYA normally, and you can try this chat again when your connection returns.',
        failed: true,
      }])
    } finally {
      setLoading(false)
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    await ask(query)
  }

  function onComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void ask(query)
    }
  }

  function newChat() {
    if (loading) return
    setMessages([])
    setQuery('')
    setShowHandoff(false)
    setHandoffStatus('')
  }

  async function retryLast() {
    if (!lastUserMessage || loading) return
    setMessages(current => current.filter((_, index) => !(index === current.length - 1 && current[index]?.failed)))
    await ask(lastUserMessage)
  }

  async function requestHandoff() {
    if (!lastUserMessage || !email.trim() || loading) return
    setLoading(true)
    setHandoffStatus('')
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: lastUserMessage,
          guest_id: guestId,
          surface: 'website-chat',
          request_handoff: true,
          contact_email: email.trim(),
        }),
      })
      const data = await response.json().catch(() => ({})) as { error?: string; ticket?: string; message?: string }
      if (!response.ok) throw new Error(data.error || 'Could not notify support.')
      setHandoffStatus(`${data.message || 'PeterSmart Link support has been notified.'}${data.ticket ? ` Ticket: ${data.ticket}` : ''}`)
      setShowHandoff(false)
    } catch (error) {
      setHandoffStatus((error as Error).message || 'Could not notify support. Please email support@petersmartlink.com.')
    } finally {
      setLoading(false)
    }
  }

  return <section className="my-6 overflow-hidden rounded-3xl border" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-card)' }}>
    <div className="flex items-center gap-3 border-b px-4 py-3 sm:px-5" style={{ borderColor: 'var(--cosmos-divider)' }}>
      <OtyaMark />
      <div className="min-w-0 flex-1">
        <div className="font-black tracking-tight">Ask OTYA</div>
        <div className="text-xs otya-muted">Ask naturally. Follow up. OTYA keeps the conversation in context.</div>
      </div>
      {messages.length > 0 && <button type="button" onClick={newChat} disabled={loading} className="min-h-12 rounded-xl border px-3 text-sm font-semibold disabled:opacity-50" style={{ borderColor: 'var(--cosmos-divider)' }}>New chat</button>}
    </div>

    <div className="min-h-[320px] px-4 py-5 sm:px-6" aria-live="polite">
      {messages.length === 0 ? <div className="mx-auto max-w-2xl py-5 sm:py-10">
        <OtyaMark />
        <h2 className="mt-5 text-2xl sm:text-3xl font-black tracking-[-.035em]">How can I help?</h2>
        <p className="mt-2 text-sm leading-relaxed otya-muted">Ask a general question or get help with OTYA, playback, Transfer, files, storage, updates and your account. You do not need special commands.</p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {prompts.map(prompt => <button key={prompt} type="button" onClick={() => void ask(prompt)} className="min-h-12 rounded-2xl border p-4 text-left text-sm transition hover:-translate-y-0.5" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-surface)' }}>{prompt}</button>)}
        </div>
      </div> : <div className="mx-auto max-w-3xl space-y-5">
        {messages.map((message, index) => message.role === 'user'
          ? <div key={index} className="ml-auto max-w-[88%] rounded-3xl rounded-br-lg px-4 py-3 text-sm leading-relaxed" style={{ background: 'var(--cosmos-surface)' }}>{message.content}</div>
          : <div key={index} className="max-w-[94%]">
              <div className="mb-2 flex items-center gap-2"><OtyaMark /><span className="text-xs font-black">OTYA</span></div>
              <div className="whitespace-pre-wrap text-sm leading-7">{message.content}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={() => void navigator.clipboard.writeText(message.content)} className="min-h-12 rounded-xl px-3 text-xs font-semibold otya-muted">Copy</button>
                {message.failed && <button type="button" onClick={() => void retryLast()} disabled={loading} className="min-h-12 rounded-xl px-3 text-xs font-semibold">Retry</button>}
                {message.handoff && <button type="button" onClick={() => setShowHandoff(true)} className="min-h-12 rounded-xl px-3 text-xs font-semibold">Talk to support</button>}
              </div>
            </div>)}
        {loading && <div className="flex items-center gap-3 py-2" role="status" aria-label="OTYA is thinking"><OtyaMark thinking /><span className="text-sm otya-muted">Thinking…</span></div>}
      </div>}
    </div>

    {showHandoff && handoffAvailable && <div className="mx-4 mb-4 rounded-2xl border p-4 sm:mx-6" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-surface)' }}>
      <div className="font-bold">Talk to PeterSmart Link support</div>
      <p className="mt-1 text-xs otya-muted">Enter your email and OTYA will send the last question to support with a ticket number.</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input value={email} onChange={event => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="Your email" className="min-h-12 min-w-0 flex-1 rounded-xl border px-3 text-sm outline-none" style={{ borderColor: 'var(--cosmos-divider)', background: 'transparent' }} />
        <button type="button" disabled={loading || !email.trim()} onClick={() => void requestHandoff()} className="cosmos-button min-h-12 rounded-xl px-4 text-sm font-semibold disabled:opacity-50">Send to support</button>
      </div>
    </div>}

    {handoffStatus && <div className="mx-4 mb-4 text-sm otya-muted sm:mx-6" aria-live="polite">{handoffStatus}</div>}

    <form onSubmit={submit} className="border-t p-3 sm:p-4" style={{ borderColor: 'var(--cosmos-divider)' }}>
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border p-2" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-surface)' }}>
        <textarea
          value={query}
          onChange={event => setQuery(event.target.value)}
          onKeyDown={onComposerKeyDown}
          rows={1}
          placeholder="Message Ask OTYA"
          aria-label="Message Ask OTYA"
          className="max-h-40 min-h-12 min-w-0 flex-1 resize-none bg-transparent px-3 py-3 text-sm outline-none"
        />
        <button disabled={loading || !query.trim() || !guestId} aria-label="Send message" className="cosmos-button min-h-12 min-w-12 rounded-xl px-3 text-lg font-black disabled:opacity-50">↑</button>
      </div>
      <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] otya-muted">AI can make mistakes. Never send passwords, OTPs, recovery codes or secret keys.</p>
    </form>
  </section>
}
