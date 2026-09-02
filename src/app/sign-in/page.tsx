'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { OtyaBrandMark } from '@/components/OtyaBrandMark'

const API = '/api/account-session'
const GOOGLE_WEB_CLIENT_ID = '82776565585-obr8k53b8n6djsggissv8qne81cm3u5u.apps.googleusercontent.com'
const TERMS_VERSION = '2026-08-28'
const PRIVACY_VERSION = '2026-08-28'
const DEFAULT_AFTER_AUTH = 'https://space.petersmartlink.com/'
const VERIFY_CODE = /^[A-Z][0-9]{4}$/

type Mode = 'signin' | 'register' | 'verify' | 'forgot' | 'reset' | 'twofactor'
type SessionUser = { email?: string | null; is_verified?: boolean | number }
type Json = {
  error?: string
  code?: string
  message?: string
  authenticated?: boolean
  authorization_url?: string
  verification_required?: boolean
  verification_sent?: boolean
  user?: SessionUser
}
type GoogleCredentialResponse = { credential?: string }
type GoogleApi = { accounts: { id: { initialize(input: { client_id: string; callback: (response: GoogleCredentialResponse) => void; auto_select?: boolean }): void; renderButton(element: HTMLElement, options: Record<string, unknown>): void } } }
declare global { interface Window { google?: GoogleApi } }

async function authFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  return fetch(`${API}/${path}`, { ...init, headers, credentials: 'same-origin', cache: 'no-store' })
}

function afterAuthDestination(): string {
  if (typeof window === 'undefined') return DEFAULT_AFTER_AUTH
  const requested = new URLSearchParams(window.location.search).get('next')?.trim() ?? ''
  if (requested.startsWith('/') && !requested.startsWith('//') && !requested.includes('\\')) return requested
  return DEFAULT_AFTER_AUTH
}

function emailNeedsVerification(user?: SessionUser): boolean {
  if (!user?.email) return false
  return user.is_verified !== true && user.is_verified !== 1
}

export default function SignInPage() {
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [secondFactor, setSecondFactor] = useState('')
  const [useRecovery, setUseRecovery] = useState(false)
  const [terms, setTerms] = useState(false)
  const [privacy, setPrivacy] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const registration = mode === 'register'
  const providerMode = mode === 'signin' || mode === 'register'

  useEffect(() => {
    let cancelled = false
    void authFetch('session').then(async response => {
      const data = await response.json().catch(() => ({})) as Json
      if (cancelled || !response.ok || data.authenticated !== true) return
      if (emailNeedsVerification(data.user)) {
        setEmail(data.user?.email ?? '')
        setMode('verify')
        setNotice('Verify your email to finish setting up this Otya account.')
        return
      }
      window.location.replace(afterAuthDestination())
    }).catch(() => undefined)

    const telegram = new URLSearchParams(window.location.search).get('telegram')
    if (telegram === 'signed-in') void confirmTelegramSessionAndOpen()
    else if (telegram === 'not-linked') setNotice('That Telegram account is not linked yet. Sign in with your Otya account first, then connect Telegram from your account.')
    else if (telegram === 'expired') setError('Telegram sign-in expired. Please try again.')
    else if (telegram === 'error') setError('Telegram sign-in could not be completed.')
    else if (telegram === 'cancelled') setNotice('Telegram sign-in was cancelled.')

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = window.setInterval(() => {
      setResendCooldown(value => value <= 1 ? 0 : value - 1)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendCooldown])

  useEffect(() => {
    if (!providerMode) return
    let cancelled = false
    const setup = () => {
      if (cancelled || !window.google || !googleButtonRef.current) return
      googleButtonRef.current.replaceChildren()
      window.google.accounts.id.initialize({ client_id: GOOGLE_WEB_CLIENT_ID, callback: response => void completeGoogle(response), auto_select: false })
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'icon',
        theme: 'outline',
        size: 'large',
        shape: 'circle',
      })
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-otya-google]')
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
      script.addEventListener('error', () => setError('Google Sign-In could not be loaded. You can still use email.'), { once: true })
      document.head.appendChild(script)
    }
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, terms, privacy, marketing])

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
    setNotice('')
    setOtp('')
    setNewPassword('')
    setConfirmPassword('')
    setSecondFactor('')
    setUseRecovery(false)
  }

  function openSpace() {
    window.location.replace(afterAuthDestination())
  }

  async function confirmTelegramSessionAndOpen() {
    try {
      const response = await authFetch('session')
      const data = await response.json().catch(() => ({})) as Json
      if (!response.ok || data.authenticated !== true) throw new Error('Telegram sign-in did not create a secure Otya session. Please try again.')
      if (emailNeedsVerification(data.user)) {
        setEmail(data.user?.email ?? '')
        setMode('verify')
        setNotice('Verify your email to finish setting up this Otya account.')
        return
      }
      openSpace()
    } catch (cause) {
      setError((cause as Error).message)
    }
  }

  async function completeGoogle(response: GoogleCredentialResponse) {
    const idToken = response.credential || ''
    if (!idToken) return setError('Google did not return a valid sign-in credential.')
    if (registration && (!terms || !privacy)) return setError('Accept the Terms and Privacy Policy before creating your account.')
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await authFetch('google', {
        method: 'POST',
        body: JSON.stringify({
          id_token: idToken,
          ...(registration ? {
            terms_accepted: true,
            terms_version: TERMS_VERSION,
            privacy_accepted: true,
            privacy_version: PRIVACY_VERSION,
            marketing_consent: marketing,
          } : {}),
        }),
      })
      const data = await result.json().catch(() => ({})) as Json
      if (!result.ok) {
        if (result.status === 428 || data.code === 'LEGAL_ACCEPTANCE_REQUIRED') {
          setMode('register')
          throw new Error('This Google account is new to Otya. Accept the Terms and Privacy Policy, then continue with Google again.')
        }
        throw new Error(data.error || 'Google Sign-In failed.')
      }
      openSpace()
    } catch (cause) { setError((cause as Error).message) }
    finally { setBusy(false) }
  }

  async function startTelegram() {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      const response = await fetch('/api/auth/telegram/start?mode=login', { method: 'POST', credentials: 'same-origin', cache: 'no-store' })
      const data = await response.json().catch(() => ({})) as Json
      if (!response.ok || !data.authorization_url) throw new Error(data.error || 'Telegram Sign-In is temporarily unavailable.')
      window.location.assign(data.authorization_url)
    } catch (cause) {
      setError((cause as Error).message)
      setBusy(false)
    }
  }

  async function resendVerification() {
    if (busy || resendCooldown > 0) return
    setBusy(true); setError(''); setNotice('')
    try {
      const response = await authFetch('send-verification', { method: 'POST' })
      const data = await response.json().catch(() => ({})) as Json
      if (!response.ok) throw new Error(data.error || 'Could not send a verification code.')
      setResendCooldown(30)
      setNotice(data.message || `A new verification code was sent to ${email}.`)
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!email.trim()) return setError('Enter your email address.')
    if ((mode === 'signin' || mode === 'register' || mode === 'twofactor') && !password) return setError('Enter your password.')
    if (registration && (!terms || !privacy)) return setError('Accept the Terms and Privacy Policy to create your account.')
    if (mode === 'twofactor' && !secondFactor.trim()) return setError(useRecovery ? 'Enter a recovery code.' : 'Enter your authenticator code.')
    if (mode === 'verify' && !VERIFY_CODE.test(otp.trim().toUpperCase())) return setError('Enter the 5-character verification code from your email, for example A1234.')
    if (mode === 'reset' && (!otp.trim() || newPassword.length < 8)) return setError('Enter the reset code and a new password of at least 8 characters.')
    if (mode === 'reset' && newPassword !== confirmPassword) return setError('The new passwords do not match.')

    setBusy(true); setError(''); setNotice('')
    try {
      if (mode === 'forgot') {
        const response = await authFetch('forgot-password', { method: 'POST', body: JSON.stringify({ email: email.trim() }) })
        const data = await response.json().catch(() => ({})) as Json
        if (!response.ok) throw new Error(data.error || 'Could not request a password reset.')
        setNotice(data.message || 'If that account exists, a reset code has been requested.')
        setMode('reset')
        return
      }

      if (mode === 'reset') {
        const response = await authFetch('reset-password', { method: 'POST', body: JSON.stringify({ email: email.trim(), otp: otp.trim().toUpperCase(), new_password: newPassword }) })
        const data = await response.json().catch(() => ({})) as Json
        if (!response.ok) throw new Error(data.error || 'Could not reset your password.')
        setPassword(''); setNewPassword(''); setConfirmPassword(''); setOtp(''); setMode('signin')
        setNotice(data.message || 'Password updated. Sign in with your new password.')
        return
      }

      if (mode === 'verify') {
        const response = await authFetch('verify-email', { method: 'POST', body: JSON.stringify({ otp: otp.trim().toUpperCase() }) })
        const data = await response.json().catch(() => ({})) as Json
        if (!response.ok) throw new Error(data.error || 'Could not verify your email.')
        setOtp('')
        openSpace()
        return
      }

      const endpoint = registration ? 'register' : 'login'
      const payload = registration
        ? {
            email: email.trim(),
            password,
            name: name.trim() || undefined,
            terms_accepted: true,
            terms_version: TERMS_VERSION,
            privacy_accepted: true,
            privacy_version: PRIVACY_VERSION,
            marketing_consent: marketing,
          }
        : {
            email: email.trim(),
            password,
            ...(mode === 'twofactor' && !useRecovery ? { totp_code: secondFactor.trim() } : {}),
            ...(mode === 'twofactor' && useRecovery ? { recovery_code: secondFactor.trim() } : {}),
          }
      const response = await authFetch(endpoint, { method: 'POST', body: JSON.stringify(payload) })
      const data = await response.json().catch(() => ({})) as Json
      if (!response.ok) {
        if (data.code === 'TWO_FACTOR_REQUIRED' || data.code === 'TWO_FACTOR_INVALID') {
          setMode('twofactor'); setSecondFactor('')
          throw new Error(data.error || 'Two-step verification is required.')
        }
        throw new Error(data.error || (registration ? 'Account creation failed.' : 'Sign in failed.'))
      }

      if (registration || emailNeedsVerification(data.user)) {
        setOtp('')
        setMode('verify')
        if (registration && data.verification_sent !== false) {
          setResendCooldown(30)
          setNotice(`We sent one verification code to ${email.trim()}. Enter it below to finish creating your Otya account.`)
        } else if (registration) {
          setNotice('Your Otya account was created, but the first verification email could not be delivered. Use Resend code below; do not create another account.')
        } else {
          setNotice('This email is not verified yet. Request a verification code below, then enter it to continue.')
        }
        return
      }

      openSpace()
    } catch (cause) { setError((cause as Error).message) }
    finally { setBusy(false) }
  }

  const title = mode === 'register'
    ? 'Create your Otya account'
    : mode === 'verify'
      ? 'Verify your email'
      : mode === 'twofactor'
        ? 'Confirm it’s you'
        : mode === 'forgot'
          ? 'Reset your password'
          : mode === 'reset'
            ? 'Choose a new password'
            : 'Sign in to Otya'
  const subtitle = mode === 'verify'
    ? `Enter the 5-character code for ${email || 'your email'}. We never ask you to create the account twice.`
    : mode === 'twofactor'
      ? 'Use your authenticator or a recovery code.'
      : mode === 'forgot'
        ? 'Enter your email to request a reset code.'
        : mode === 'reset'
          ? 'Enter the code from your email and choose a new password.'
          : registration
            ? 'Create one account for Otya.'
            : 'Use your Otya account.'

  return <main className="min-h-screen bg-[color:var(--cosmos-scaffold)] text-[color:var(--cosmos-text-primary)] grid place-items-center px-4 py-8 sm:py-12">
    <section className="w-full max-w-[460px]">
      <Link href="https://petersmartlink.com/" aria-label="Otya home" className="inline-flex items-center gap-1.5 mb-8">
        <OtyaBrandMark size={42} />
        <span className="font-black text-[22px] tracking-[-.05em]">tya</span>
      </Link>

      <div className="rounded-[30px] border border-black/[.07] dark:border-white/[.10] bg-[color:var(--cosmos-surface)] p-5 sm:p-7 shadow-[0_24px_80px_rgba(20,16,35,.09)]">
        <h1 className="text-3xl sm:text-4xl font-black tracking-[-.05em]">{title}</h1>
        <p className="mt-2 mb-6 text-sm leading-6 otya-muted">{subtitle}</p>

        {error && <div role="alert" className="rounded-2xl border border-red-500/20 bg-red-500/[.07] px-4 py-3 mb-4 text-sm text-red-700 dark:text-red-200">{error}</div>}
        {notice && <div role="status" className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[.07] px-4 py-3 mb-4 text-sm text-emerald-700 dark:text-emerald-200">{notice}</div>}

        <form onSubmit={submit} className="space-y-3">
          {registration && <Field value={name} onChange={setName} placeholder="Name" autoComplete="name" />}
          <Field value={email} onChange={setEmail} placeholder="Email" type="email" autoComplete="email" disabled={mode === 'twofactor' || mode === 'reset' || mode === 'verify'} />
          {(mode === 'signin' || mode === 'register' || mode === 'twofactor') && <Field value={password} onChange={setPassword} placeholder="Password" type="password" autoComplete={registration ? 'new-password' : 'current-password'} disabled={mode === 'twofactor'} />}
          {mode === 'twofactor' && <><Field value={secondFactor} onChange={setSecondFactor} placeholder={useRecovery ? 'Recovery code' : '6-digit authenticator code'} autoFocus/><button type="button" onClick={() => { setUseRecovery(value => !value); setSecondFactor(''); setError('') }} className="w-full min-h-11 py-1 text-sm font-bold otya-muted">{useRecovery ? 'Use authenticator code instead' : 'Use a recovery code instead'}</button></>}
          {mode === 'verify' && <Field value={otp} onChange={value => setOtp(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))} placeholder="A1234" autoComplete="one-time-code" autoFocus />}
          {mode === 'reset' && <><Field value={otp} onChange={value => setOtp(value.toUpperCase())} placeholder="Reset code" autoComplete="one-time-code"/><Field value={newPassword} onChange={setNewPassword} placeholder="New password" type="password" autoComplete="new-password"/><Field value={confirmPassword} onChange={setConfirmPassword} placeholder="Confirm new password" type="password" autoComplete="new-password"/></>}

          {registration && <div className="space-y-3 py-2 text-sm otya-muted">
            <Check checked={terms} onChange={setTerms}>I accept the <a href="https://petersmartlink.com/terms" className="font-black text-[color:var(--cosmos-text-primary)]">Terms</a>.</Check>
            <Check checked={privacy} onChange={setPrivacy}>I accept the <a href="https://petersmartlink.com/privacy" className="font-black text-[color:var(--cosmos-text-primary)]">Privacy Policy</a>.</Check>
            <Check checked={marketing} onChange={setMarketing}>Send me optional Otya product news.</Check>
          </div>}

          <button disabled={busy} className="cosmos-button w-full rounded-full min-h-12 px-5 font-black disabled:opacity-55">
            {busy
              ? 'Please wait…'
              : mode === 'register'
                ? 'Create account'
                : mode === 'verify'
                  ? 'Verify email and continue'
                  : mode === 'twofactor'
                    ? 'Verify and sign in'
                    : mode === 'forgot'
                      ? 'Request reset code'
                      : mode === 'reset'
                        ? 'Update password'
                        : 'Sign in'}
          </button>
        </form>

        {mode === 'verify' && <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <button type="button" onClick={() => void resendVerification()} disabled={busy || resendCooldown > 0} className="otya-quiet-button min-h-11 flex-1 rounded-full px-4 text-sm font-black disabled:opacity-50">
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
          </button>
          <button type="button" onClick={() => switchMode('signin')} disabled={busy} className="min-h-11 flex-1 rounded-full px-4 text-sm font-black otya-muted disabled:opacity-50">Use another account</button>
        </div>}

        <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-bold otya-muted">
          {mode === 'signin' && <><button type="button" onClick={() => switchMode('register')}>Create account</button><button type="button" onClick={() => switchMode('forgot')}>Forgot password?</button></>}
          {mode === 'register' && <button type="button" onClick={() => switchMode('signin')}>Already have an account?</button>}
          {(mode === 'forgot' || mode === 'reset' || mode === 'twofactor') && <button type="button" onClick={() => switchMode('signin')}>Back to sign in</button>}
        </div>

        {providerMode && <div className="mt-7 border-t border-black/[.07] dark:border-white/[.08] pt-5">
          <p className="mb-3 text-center text-[11px] font-bold tracking-wide otya-muted">Other ways to continue</p>
          <div className={`flex items-center justify-center gap-3 ${busy ? 'pointer-events-none opacity-55' : ''}`}>
            <div ref={googleButtonRef} className="h-11 w-11 overflow-hidden rounded-full grid place-items-center" aria-label="Continue with Google" title="Continue with Google" />
            <button type="button" onClick={() => void startTelegram()} disabled={busy} aria-label="Continue with Telegram" title="Continue with Telegram" className="h-11 w-11 grid place-items-center rounded-full border border-black/[.08] dark:border-white/[.10] bg-transparent disabled:opacity-35">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current"><path d="M21.6 3.5 18.7 20c-.2 1.2-.8 1.5-1.7.9l-4.5-3.3-2.2 2.1c-.2.2-.4.4-.8.4l.3-4.6 8.4-7.6c.4-.3-.1-.5-.6-.2L7.2 14.2 2.7 12.8c-1-.3-1-1 .2-1.5L20.4 4.5c.8-.3 1.5.2 1.2-1z"/></svg>
            </button>
          </div>
        </div>}
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs otya-muted">
        <a href="https://petersmartlink.com/terms">Terms</a>
        <a href="https://petersmartlink.com/privacy">Privacy</a>
        <a href="https://docs.petersmartlink.com">Help</a>
      </div>
    </section>
  </main>
}

function Field({ value, onChange, placeholder, type = 'text', autoComplete, disabled, autoFocus }: { value:string; onChange:(value:string)=>void; placeholder:string; type?:string; autoComplete?:string; disabled?:boolean; autoFocus?:boolean }) {
  return <input value={value} onChange={event => onChange(event.target.value)} type={type} placeholder={placeholder} autoComplete={autoComplete} disabled={disabled} autoFocus={autoFocus} className="w-full min-h-12 rounded-2xl border border-black/[.08] dark:border-white/[.10] px-4 outline-none bg-transparent placeholder:text-black/35 dark:placeholder:text-white/35 disabled:opacity-50 focus:border-[color:var(--cosmos-primary)]" />
}

function Check({ checked, onChange, children }: { checked:boolean; onChange:(value:boolean)=>void; children:React.ReactNode }) {
  return <label className="flex gap-3 items-start"><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="mt-1 accent-violet-500"/><span>{children}</span></label>
}
