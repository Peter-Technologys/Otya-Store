'use client'

import { ReactNode } from 'react'

export function SpacePage({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return <main className="px-4 sm:px-7 lg:px-10 py-7 sm:py-9 max-w-[1040px]">
    <header className="mb-7">
      <div className="text-[11px] font-black uppercase tracking-[.16em] otya-muted">Otya Space</div>
      <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-[-.045em]">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm sm:text-base leading-7 otya-muted">{subtitle}</p>
    </header>
    {children}
  </main>
}

export function SpaceCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  action?: ReactNode
}) {
  return <section className="rounded-[22px] border p-5 sm:p-6" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-card)' }}>
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <h2 className="text-lg sm:text-xl font-black tracking-[-.025em]">{title}</h2>
        {subtitle && <p className="mt-1 text-sm leading-6 otya-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
}

export function SpaceField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  disabled?: boolean
  autoComplete?: string
}) {
  return <label className="block">
    <span className="text-xs font-black otya-muted">{label}</span>
    <input
      value={value}
      onChange={event => onChange(event.target.value)}
      type={type}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete={autoComplete}
      className="mt-1.5 w-full min-h-11 rounded-xl border px-3 bg-transparent outline-none disabled:opacity-55 focus:border-[color:var(--cosmos-primary)]"
      style={{ borderColor: 'var(--cosmos-divider)' }}
    />
  </label>
}

export function SpaceReadOnly({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="rounded-xl border px-3.5 py-3" style={{ borderColor: 'var(--cosmos-divider)' }}>
    <div className="text-[11px] font-black otya-muted">{label}</div>
    <div className={`mt-1 text-sm font-bold break-words ${mono ? 'font-mono' : ''}`}>{value}</div>
  </div>
}

export function SpaceMessage({ kind = 'notice', children }: { kind?: 'notice' | 'error'; children: ReactNode }) {
  if (kind === 'error') return <div role="alert" className="mb-5 rounded-2xl border border-red-500/25 bg-red-500/[.05] px-4 py-3 text-sm text-red-700 dark:text-red-200">{children}</div>
  return <div role="status" className="mb-5 rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--cosmos-divider)', background: 'var(--cosmos-card)' }}>{children}</div>
}

export function SpaceEmpty({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed p-5 text-sm leading-6 otya-muted" style={{ borderColor: 'var(--cosmos-divider)' }}>{children}</div>
}

export function SpaceLoading({ label = 'Loading…' }: { label?: string }) {
  return <div className="min-h-[42vh] grid place-items-center">
    <div className="text-center">
      <div className="mx-auto h-1 w-28 overflow-hidden rounded-full" style={{ background: 'var(--cosmos-divider)' }}><div className="h-full w-1/2 animate-pulse rounded-full" style={{ background: 'var(--cosmos-primary)' }} /></div>
      <p className="mt-3 text-sm otya-muted">{label}</p>
    </div>
  </div>
}

export function SpaceButton({
  children,
  onClick,
  disabled,
  quiet = false,
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  quiet?: boolean
  type?: 'button' | 'submit'
}) {
  return <button type={type} onClick={onClick} disabled={disabled} className={`${quiet ? 'otya-quiet-button' : 'cosmos-button'} min-h-11 rounded-xl px-4 text-sm font-black disabled:opacity-50`}>{children}</button>
}
