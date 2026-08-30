'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

const API = '/api/account-session'
const GOOGLE_WEB_CLIENT_ID = '82776565585-obr8k53b8n6djsggissv8qne81cm3u5u.apps.googleusercontent.com'
const TERMS_VERSION = '2026-08-28'
const PRIVACY_VERSION = '2026-08-28'

type GoogleCredentialResponse = { credential?: string }
type GoogleApi = {
  accounts: {
    id: {
      initialize(input: { client_id: string; callback: (response: GoogleCredentialResponse) => void; auto_select?: boolean }): void
      renderButton(element: HTMLElement, options: Record<string, unknown>): void
    }
  }
}

declare global {
  interface Window { google?: GoogleApi }
}

async function authFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  return fetch(`${API}/${path}`, { ...init, headers, credentials: 'same-origin', cache: 'no-store' })
}

export default function SignInPage() {
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const [registering, setRegistering] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [terms, setTerms] = useState(false)
  const [privacy, setPrivacy] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void authFetch('session').then(async response => {
      const data = await response.json().catch(() => ({})) as { authenticated?: boolean }
      if (response.ok && data.authenticated) window.location.replace('/account')
    }).catch(() => undefined)

    let cancelled = false
    const existing = document.querySelector<HTMLScriptElement>('script[data-otya-google]')
    const setup = () => {
      if (cancelled || !window.google || !googleButtonRef.current) return
      googleButtonRef.current.replaceChildren()
      window.google.accounts.id.initialize({
        client_id: GOOGLE_WEB_CLIENT_ID,
        callback: response => void completeGoogle(response),
        auto_select: false,
      })
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: registering ? 'signup_with' : 'continue_with',
        shape: 'rectangular',
        width: 360,
      })
    }

    if (existing) {
      if (window.google) setup()
      else existing.addEventListener('load', setup, { once: true })
    } else {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.dataset.otyaGoogle = 'true'
      script.addEventListener('load', setup, { once: true })
      script.addEventListener('error', () => setError('Google Sign-In could not be loaded. Check your connection and try again.'), { once: true })
      document.head.appendChild(script)
    }
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registering, terms, privacy, marketing])

  async function completeGoogle(response: GoogleCredentialResponse) {
    const idToken = response.credential || ''
    if (!idToken) {
      setError('Google did not return a valid sign-in credential.')
      return
    }
    if (registering && (!terms || !privacy)) {
      setError('Accept the Terms and Privacy Policy before creating an OTYA account with Google.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const result = await authFetch('google', {
        method: 'POST',
        body: JSON.stringify({
          id_token: idToken,
          ...(registering ? {
            terms_accepted: true,
            terms_version: TERMS_VERSION,
            privacy_accepted: true,
            privacy_version: PRIVACY_VERSION,
            marketing_consent: marketing,
          } : {}),
        }),
      })
      const data = await result.json().catch(() => ({})) as { error?: string; code?: string }
      if (!result.ok) {
        if (result.status === 428 || data.code === 'LEGAL_ACCEPTANCE_REQUIRED') {
          setRegistering(true)
          throw new Error('This Google account is new to OTYA. Accept the Terms and Privacy Policy, then continue with Google again.')
        }
        throw new Error(data.error || 'Google Sign-In failed.')
      }
      window.location.replace('/account')
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function startTelegram() {
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/auth/telegram/start?mode=login', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
      })
      const data = await response.json().catch(() => ({})) as { authorization_url?: string; error?: string }
      if (!response.ok || !data.authorization_url) throw new Error(data.error || 'Telegram Sign-In is unavailable right now.')
      window.location.assign(data.authorization_url)
    } catch (cause) {
      setError((cause as Error).message)
      setBusy(false)
    }
  }

  async function submitEmail(event: FormEvent) {
    event.preventDefault()
    if (!email.trim() || !password) return
    if (registering && (!terms || !privacy)) {
      setError('Accept the Terms and Privacy Policy to create your OTYA account.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const response = await authFetch(registering ? 'register' : 'login', {
        method: 'POST',
        body: JSON.stringify(registering ? {
          email: email.trim(), password, name: name.trim() || undefined,
          terms_accepted: true, terms_version: TERMS_VERSION,
          privacy_accepted: true, privacy_version: PRIVACY_VERSION,
          marketing_consent: marketing,
        } : { email: email.trim(), password }),
      })
      const data = await response.json().catch(() => ({})) as { error?: string; code?: string }
      if (!response.ok) throw new Error(data.error || (registering ? 'Account creation failed.' : 'Sign in failed.'))
      window.location.replace('/account')
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return <div className="min-h-screen flex flex-col" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
    <SiteNav />
    <main className="flex-1 grid place-items-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-md modern-card p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-7">
          <img src="/otya-icon.svg" alt="OTYA" className="w-11 h-11 rounded-xl" />
          <div><div className="font-black text-lg">OTYA</div><div className="text-xs otya-muted">Account</div></div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-[-.04em]">{registering ? 'Create your account' : 'Sign in'}</h1>
        <p className="text-sm otya-muted mt-2 mb-6">One OTYA account across the website and supported app services.</p>

        {error && <div className="rounded-xl border px-4 py-3 mb-4 text-sm" style={{ borderColor: 'rgba(239,68,68,.35)', background: 'rgba(239,68,68,.08)' }}>{error}</div>}

        <div className={busy ? 'pointer-events-none opacity-60' : ''}>
          <div ref={googleButtonRef} className="w-full min-h-[44px] flex justify-center" aria-label="Continue with Google" />
          <button type="button" onClick={() => void startTelegram()} disabled={busy} className="otya-quiet-button w-full rounded-xl min-h-12 px-4 mt-3 font-bold flex items-center justify-center gap-2 disabled:opacity-55">
            <span aria-hidden="true">➤</span><span>Continue with Telegram</span>
          </button>
        </div>

        <div className="flex items-center gap-3 my-6"><div className="h-px flex-1" style={{ background: 'var(--cosmos-divider)' }} /><span className="text-[11px] font-bold otya-muted">OR</span><div className="h-px flex-1" style={{ background: 'var(--cosmos-divider)' }} /></div>

        <form onSubmit={submitEmail} className="space-y-3">
          {registering && <input value={name} onChange={e => setName(e.target.value)} placeholder="Name (optional)" autoComplete="name" className="w-full min-h-12 rounded-xl border px-4 bg-transparent" style={{ borderColor: 'var(--cosmos-divider)' }} />}
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email" autoComplete="email" required className="w-full min-h-12 rounded-xl border px-4 bg-transparent" style={{ borderColor: 'var(--cosmos-divider)' }} />
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" autoComplete={registering ? 'new-password' : 'current-password'} required className="w-full min-h-12 rounded-xl border px-4 bg-transparent" style={{ borderColor: 'var(--cosmos-divider)' }} />

          {registering && <div className="space-y-3 py-2 text-sm">
            <label className="flex gap-3 items-start"><input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} className="mt-1" /><span>I accept the <Link href="/terms" className="font-semibold">Terms</Link>.</span></label>
            <label className="flex gap-3 items-start"><input type="checkbox" checked={privacy} onChange={e => setPrivacy(e.target.checked)} className="mt-1" /><span>I accept the <Link href="/privacy" className="font-semibold">Privacy Policy</Link>.</span></label>
            <label className="flex gap-3 items-start"><input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)} className="mt-1" /><span>Send me optional OTYA product news.</span></label>
          </div>}

          <button disabled={busy} className="cosmos-button w-full rounded-xl min-h-12 px-5 font-bold disabled:opacity-55">{busy ? 'Please wait…' : registering ? 'Create account' : 'Sign in with email'}</button>
        </form>

        <button type="button" onClick={() => { setRegistering(v => !v); setError('') }} className="w-full py-3 mt-1 text-sm font-semibold otya-muted">{registering ? 'Already have an account? Sign in' : 'New to OTYA? Create an account'}</button>
        {!registering && <div className="text-center mt-1"><Link href="/account" className="text-sm font-semibold">Account help & recovery</Link></div>}
      </div>
    </main>
    <SiteFooter />
  </div>
}
