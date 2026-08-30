'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

const API = '/api/account-session'
const GOOGLE_WEB_CLIENT_ID = '82776565585-obr8k53b8n6djsggissv8qne81cm3u5u.apps.googleusercontent.com'
const TERMS_VERSION = '2026-08-28'
const PRIVACY_VERSION = '2026-08-28'

type Mode = 'signin' | 'register' | 'twofactor' | 'forgot' | 'reset'
type Json = { error?: string; code?: string; message?: string; authenticated?: boolean }
type GoogleCredentialResponse = { credential?: string }
type GoogleApi = { accounts: { id: { initialize(input: { client_id: string; callback: (response: GoogleCredentialResponse) => void; auto_select?: boolean }): void; renderButton(element: HTMLElement, options: Record<string, unknown>): void } } }
declare global { interface Window { google?: GoogleApi } }

async function authFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  return fetch(`${API}/${path}`, { ...init, headers, credentials: 'same-origin', cache: 'no-store' })
}

export default function SignInPage() {
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [name, setName] = useState('')
  const [otp, setOtp] = useState('')
  const [secondFactor, setSecondFactor] = useState('')
  const [useRecovery, setUseRecovery] = useState(false)
  const [terms, setTerms] = useState(false)
  const [privacy, setPrivacy] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const registration = mode === 'register'
  const providerMode = mode === 'signin' || mode === 'register'

  useEffect(() => {
    void authFetch('session').then(async response => {
      const data = await response.json().catch(() => ({})) as Json
      if (response.ok && data.authenticated) window.location.replace('/account')
    }).catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!providerMode) return
    let cancelled = false
    const setup = () => {
      if (cancelled || !window.google || !googleButtonRef.current) return
      googleButtonRef.current.replaceChildren()
      window.google.accounts.id.initialize({ client_id: GOOGLE_WEB_CLIENT_ID, callback: response => void completeGoogle(response), auto_select: false })
      window.google.accounts.id.renderButton(googleButtonRef.current, { type: 'standard', theme: 'filled_black', size: 'large', text: registration ? 'signup_with' : 'continue_with', shape: 'pill', width: 360 })
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
      script.addEventListener('error', () => setError('Google Sign-In could not be loaded. Check your connection and try again.'), { once: true })
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
    setSecondFactor('')
    setUseRecovery(false)
  }

  async function completeGoogle(response: GoogleCredentialResponse) {
    const idToken = response.credential || ''
    if (!idToken) return setError('Google did not return a valid sign-in credential.')
    if (registration && (!terms || !privacy)) return setError('Accept the Terms and Privacy Policy before creating an Otya account with Google.')
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await authFetch('google', { method: 'POST', body: JSON.stringify({ id_token: idToken, ...(registration ? { terms_accepted: true, terms_version: TERMS_VERSION, privacy_accepted: true, privacy_version: PRIVACY_VERSION, marketing_consent: marketing } : {}) }) })
      const data = await result.json().catch(() => ({})) as Json
      if (!result.ok) {
        if (result.status === 428 || data.code === 'LEGAL_ACCEPTANCE_REQUIRED') {
          setMode('register')
          throw new Error('This Google account is new to Otya. Accept the Terms and Privacy Policy, then continue with Google again.')
        }
        throw new Error(data.error || 'Google Sign-In failed.')
      }
      window.location.replace('/account')
    } catch (cause) { setError((cause as Error).message) }
    finally { setBusy(false) }
  }

  async function startTelegram() {
    setBusy(true); setError(''); setNotice('')
    try {
      const response = await fetch('/api/auth/telegram/start?mode=login', { method: 'POST', headers: { Accept: 'application/json' }, credentials: 'same-origin', cache: 'no-store' })
      const data = await response.json().catch(() => ({})) as { authorization_url?: string; error?: string }
      if (!response.ok || !data.authorization_url) throw new Error(data.error || 'Telegram Sign-In is unavailable right now.')
      window.location.assign(data.authorization_url)
    } catch (cause) { setError((cause as Error).message); setBusy(false) }
  }

  async function submitEmail(event: FormEvent) {
    event.preventDefault()
    if (!email.trim()) return setError('Enter your email address.')
    if ((mode === 'signin' || mode === 'register' || mode === 'twofactor') && !password) return setError('Enter your password.')
    if (registration && (!terms || !privacy)) return setError('Accept the Terms and Privacy Policy to create your Otya account.')
    if (mode === 'twofactor' && !secondFactor.trim()) return setError(useRecovery ? 'Enter a recovery code.' : 'Enter your authenticator code.')
    if (mode === 'reset' && (!otp.trim() || newPassword.length < 8)) return setError('Enter the reset code and a new password of at least 8 characters.')

    setBusy(true); setError(''); setNotice('')
    try {
      if (mode === 'forgot') {
        const response = await authFetch('forgot-password', { method: 'POST', body: JSON.stringify({ email: email.trim() }) })
        const data = await response.json().catch(() => ({})) as Json
        if (!response.ok) throw new Error(data.error || 'Could not request a password reset.')
        setNotice(data.message || 'If that account exists, a reset code has been sent.')
        setMode('reset')
        return
      }
      if (mode === 'reset') {
        const response = await authFetch('reset-password', { method: 'POST', body: JSON.stringify({ email: email.trim(), otp: otp.trim(), new_password: newPassword }) })
        const data = await response.json().catch(() => ({})) as Json
        if (!response.ok) throw new Error(data.error || 'Could not reset your password.')
        setPassword(''); setNewPassword(''); setOtp(''); setMode('signin')
        setNotice(data.message || 'Password updated. Sign in with your new password.')
        return
      }

      const endpoint = registration ? 'register' : 'login'
      const payload = registration
        ? { email: email.trim(), password, name: name.trim() || undefined, terms_accepted: true, terms_version: TERMS_VERSION, privacy_accepted: true, privacy_version: PRIVACY_VERSION, marketing_consent: marketing }
        : { email: email.trim(), password, ...(mode === 'twofactor' && !useRecovery ? { totp_code: secondFactor.trim() } : {}), ...(mode === 'twofactor' && useRecovery ? { recovery_code: secondFactor.trim() } : {}) }
      const response = await authFetch(endpoint, { method: 'POST', body: JSON.stringify(payload) })
      const data = await response.json().catch(() => ({})) as Json
      if (!response.ok) {
        if (data.code === 'TWO_FACTOR_REQUIRED' || data.code === 'TWO_FACTOR_INVALID') {
          setMode('twofactor'); setSecondFactor('')
          throw new Error(data.error || 'Two-step verification is required.')
        }
        throw new Error(data.error || (registration ? 'Account creation failed.' : 'Sign in failed.'))
      }
      window.location.replace('/account')
    } catch (cause) { setError((cause as Error).message) }
    finally { setBusy(false) }
  }

  const title = mode === 'register' ? 'Create your account' : mode === 'twofactor' ? 'Confirm it’s you' : mode === 'forgot' ? 'Recover your account' : mode === 'reset' ? 'Set a new password' : 'Welcome back'
  const subtitle = mode === 'twofactor' ? 'Use your authenticator or one recovery code.' : mode === 'forgot' ? 'We’ll send a one-time reset code if the account exists.' : mode === 'reset' ? 'Enter the code from your email and choose a new password.' : 'One secure Otya account for connected features.'

  return <div className="min-h-screen flex flex-col overflow-hidden" style={{ color: '#f8f7ff', background: 'radial-gradient(circle at 16% 18%, rgba(112,74,255,.34), transparent 34%), radial-gradient(circle at 84% 28%, rgba(0,184,255,.20), transparent 34%), radial-gradient(circle at 56% 92%, rgba(235,70,255,.15), transparent 38%), #090812' }}>
    <SiteNav />
    <main className="relative flex-1 grid place-items-center px-4 py-10 sm:py-14">
      <div className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full blur-3xl animate-pulse" style={{ background: 'rgba(110,71,255,.18)' }} />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full blur-3xl animate-pulse" style={{ background: 'rgba(0,175,255,.12)', animationDelay: '1.2s' }} />
      <div className="relative w-full max-w-[460px] rounded-[28px] border p-6 sm:p-8 shadow-2xl backdrop-blur-2xl" style={{ background: 'linear-gradient(155deg, rgba(27,23,49,.88), rgba(14,13,27,.82))', borderColor: 'rgba(180,164,255,.22)', boxShadow: '0 30px 90px rgba(0,0,0,.42)' }}>
        <div className="flex items-center gap-3 mb-7">
          <div className="w-12 h-12 rounded-2xl p-2" style={{ background: 'linear-gradient(145deg,#7c63ff,#4ec9ff)' }}><img src="/otya-icon.svg" alt="Otya" className="w-full h-full object-contain" /></div>
          <div><div className="font-black text-xl tracking-[-.035em]">Otya</div><div className="text-xs text-white/55">Account</div></div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-[-.045em]">{title}</h1>
        <p className="text-sm text-white/60 mt-2 mb-6">{subtitle}</p>
        {error && <div className="rounded-2xl border px-4 py-3 mb-4 text-sm" style={{ borderColor: 'rgba(255,100,130,.35)', background: 'rgba(255,73,112,.10)', color: '#ffd7df' }}>{error}</div>}
        {notice && <div className="rounded-2xl border px-4 py-3 mb-4 text-sm" style={{ borderColor: 'rgba(99,230,190,.28)', background: 'rgba(57,205,160,.10)', color: '#caffef' }}>{notice}</div>}

        {providerMode && <>
          <div className={busy ? 'pointer-events-none opacity-55' : ''}>
            <div ref={googleButtonRef} className="w-full min-h-[44px] flex justify-center overflow-hidden rounded-full" aria-label="Continue with Google" />
            <button type="button" onClick={() => void startTelegram()} disabled={busy} className="w-full rounded-full min-h-12 px-4 mt-3 font-bold flex items-center justify-center gap-2 border disabled:opacity-55" style={{ background: 'rgba(41,166,255,.12)', borderColor: 'rgba(93,190,255,.30)', color: '#eef9ff' }}><span aria-hidden="true">➤</span><span>Continue with Telegram</span></button>
          </div>
          <div className="flex items-center gap-3 my-6"><div className="h-px flex-1 bg-white/10" /><span className="text-[10px] font-bold text-white/40">OR</span><div className="h-px flex-1 bg-white/10" /></div>
        </>}

        <form onSubmit={submitEmail} className="space-y-3">
          {registration && <Field value={name} onChange={setName} placeholder="Name (optional)" autoComplete="name" />}
          <Field value={email} onChange={setEmail} placeholder="Email" type="email" autoComplete="email" disabled={mode === 'twofactor' || mode === 'reset'} />
          {(mode === 'signin' || mode === 'register' || mode === 'twofactor') && <Field value={password} onChange={setPassword} placeholder="Password" type="password" autoComplete={registration ? 'new-password' : 'current-password'} disabled={mode === 'twofactor'} />}
          {mode === 'twofactor' && <>
            <Field value={secondFactor} onChange={setSecondFactor} placeholder={useRecovery ? 'Recovery code' : '6-digit authenticator code'} autoFocus />
            <button type="button" onClick={() => { setUseRecovery(v => !v); setSecondFactor(''); setError('') }} className="w-full py-1 text-sm text-white/65">{useRecovery ? 'Use authenticator code instead' : 'Use a recovery code instead'}</button>
          </>}
          {mode === 'reset' && <>
            <Field value={otp} onChange={setOtp} placeholder="Reset code" autoComplete="one-time-code" />
            <Field value={newPassword} onChange={setNewPassword} placeholder="New password" type="password" autoComplete="new-password" />
          </>}

          {registration && <div className="space-y-3 py-2 text-sm text-white/70">
            <Check checked={terms} onChange={setTerms}>I accept the <Link href="/terms" className="font-bold text-white">Terms</Link>.</Check>
            <Check checked={privacy} onChange={setPrivacy}>I accept the <Link href="/privacy" className="font-bold text-white">Privacy Policy</Link>.</Check>
            <Check checked={marketing} onChange={setMarketing}>Send me optional Otya product news.</Check>
          </div>}

          <button disabled={busy} className="w-full rounded-full min-h-12 px-5 font-black disabled:opacity-55 transition-transform active:scale-[.99]" style={{ background: 'linear-gradient(100deg,#8067ff,#9d59ff 46%,#3bbdf5)', color: '#fff', boxShadow: '0 12px 34px rgba(113,77,255,.28)' }}>{busy ? 'Please wait…' : mode === 'register' ? 'Create account' : mode === 'twofactor' ? 'Verify and sign in' : mode === 'forgot' ? 'Send reset code' : mode === 'reset' ? 'Update password' : 'Sign in with email'}</button>
        </form>

        <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-white/60">
          {mode === 'signin' && <><button type="button" onClick={() => switchMode('register')}>Create account</button><button type="button" onClick={() => switchMode('forgot')}>Forgot password?</button></>}
          {mode === 'register' && <button type="button" onClick={() => switchMode('signin')}>Already have an account?</button>}
          {(mode === 'forgot' || mode === 'reset' || mode === 'twofactor') && <button type="button" onClick={() => switchMode('signin')}>Back to sign in</button>}
        </div>
        <div className="mt-6 text-center text-[11px] leading-relaxed text-white/38">Otya keeps browser sessions in Secure, HttpOnly cookies. Never share reset or verification codes.</div>
      </div>
    </main>
    <SiteFooter />
  </div>
}

function Field({ value, onChange, placeholder, type = 'text', autoComplete, disabled, autoFocus }: { value: string; onChange: (value: string) => void; placeholder: string; type?: string; autoComplete?: string; disabled?: boolean; autoFocus?: boolean }) {
  return <input value={value} onChange={e => onChange(e.target.value)} type={type} placeholder={placeholder} autoComplete={autoComplete} disabled={disabled} autoFocus={autoFocus} className="w-full min-h-12 rounded-2xl border px-4 outline-none placeholder:text-white/35 disabled:opacity-50" style={{ background: 'rgba(255,255,255,.055)', borderColor: 'rgba(255,255,255,.12)', color: '#fff' }} />
}
function Check({ checked, onChange, children }: { checked: boolean; onChange: (value: boolean) => void; children: React.ReactNode }) {
  return <label className="flex gap-3 items-start"><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="mt-1 accent-violet-500" /><span>{children}</span></label>
}
