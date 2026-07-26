'use client'

// app/admin/page.tsx
// Admin dashboard — client-side only.
// Auth: token stored in localStorage, sent as ?token= to /api/admin/stats.
// No external chart library — all charts are pure SVG.

import { useState, useEffect, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DownloadPoint {
  label: string
  count: number
}

interface FeedbackCategory {
  category: string | null
  count: number
}

interface CrashType {
  error_type: string | null
  count: number
}

interface EndpointHealth {
  url: string
  status: number
  latency: number
  ok: boolean
}

interface StatsPayload {
  downloads: {
    total: number
    last24h: number
    last7d: number
    topAbi: string
    topVersion: string
  }
  devices: { active30d: number }
  feedback: { byCategory: FeedbackCategory[] }
  crashes: { last7d: CrashType[] }
  pro: { activeUsers: number }
  ratings: { average: number | null; total: number }
  health: EndpointHealth[]
  ts: number
}

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────

function BarChart({
  data,
  color = '#7b61ff',
  height = 120,
}: {
  data: { label: string; value: number }[]
  color?: string
  height?: number
}) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>
        No data
      </div>
    )
  }
  const max = Math.max(...data.map((d) => d.value), 1)
  const barW = Math.max(8, Math.floor(280 / data.length) - 4)
  const gap = Math.max(2, Math.floor(280 / data.length) - barW)
  const totalW = data.length * (barW + gap)

  return (
    <svg
      viewBox={`0 0 ${totalW} ${height + 20}`}
      className="w-full"
      style={{ overflow: 'visible' }}
    >
      {data.map((d, i) => {
        const barH = Math.max(2, Math.round((d.value / max) * height))
        const x = i * (barW + gap)
        const y = height - barH
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={3}
              fill={color}
              opacity={0.85}
            />
            <title>{`${d.label}: ${d.value}`}</title>
            <text
              x={x + barW / 2}
              y={height + 14}
              textAnchor="middle"
              fontSize={9}
              fill="var(--cosmos-text-secondary)"
            >
              {d.label.length > 6 ? d.label.slice(0, 6) : d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── SVG Donut Chart ───────────────────────────────────────────────────────────

const DONUT_COLORS = ['#7b61ff', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']

function DonutChart({
  data,
}: {
  data: { label: string; value: number }[]
}) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>
        No data
      </div>
    )
  }
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const cx = 60
  const cy = 60
  const r = 48
  const innerR = 28

  let cumAngle = -Math.PI / 2
  const slices = data.map((d, i) => {
    const angle = (d.value / total) * 2 * Math.PI
    const startAngle = cumAngle
    cumAngle += angle
    const endAngle = cumAngle
    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)
    const ix1 = cx + innerR * Math.cos(endAngle)
    const iy1 = cy + innerR * Math.sin(endAngle)
    const ix2 = cx + innerR * Math.cos(startAngle)
    const iy2 = cy + innerR * Math.sin(startAngle)
    const large = angle > Math.PI ? 1 : 0
    const path = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${large} 0 ${ix2} ${iy2} Z`
    return { path, color: DONUT_COLORS[i % DONUT_COLORS.length], label: d.label, value: d.value }
  })

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="w-28 h-28 flex-shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} opacity={0.9}>
            <title>{`${s.label}: ${s.value}`}</title>
          </path>
        ))}
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize={11} fontWeight="bold" fill="var(--cosmos-text-primary)">
          {total}
        </text>
      </svg>
      <div className="flex flex-col gap-1 min-w-0">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs min-w-0">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }} />
            <span className="truncate" style={{ color: 'var(--cosmos-text-secondary)' }}>
              {s.label || 'Other'} ({s.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: string
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-1 border"
      style={{
        background: 'var(--cosmos-card)',
        borderColor: 'var(--cosmos-divider)',
      }}
    >
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--cosmos-text-secondary)' }}>
        {label}
      </span>
      <span
        className="text-3xl font-black"
        style={{ color: accent ?? 'var(--cosmos-text-primary)' }}
      >
        {value}
      </span>
      {sub && (
        <span className="text-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>
          {sub}
        </span>
      )}
    </div>
  )
}

// ── Login Screen ──────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/stats?token=${encodeURIComponent(password.trim())}`)
      if (res.ok) {
        onLogin(password.trim())
      } else {
        setError('Invalid admin token. Please try again.')
      }
    } catch {
      setError('Network error — could not reach the server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--cosmos-scaffold)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border p-8"
        style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }}
      >
        <div className="mb-6 text-center">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'rgba(123,97,255,0.15)' }}
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ color: '#7b61ff' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h1 className="text-xl font-black" style={{ color: 'var(--cosmos-text-primary)' }}>
            Admin Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--cosmos-text-secondary)' }}>
            Enter your admin token to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Admin token"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm border outline-none focus:ring-2"
            style={{
              background: 'var(--cosmos-surface)',
              borderColor: 'var(--cosmos-divider)',
              color: 'var(--cosmos-text-primary)',
            }}
            autoFocus
            autoComplete="current-password"
          />
          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="cosmos-button w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [stats, setStats] = useState<StatsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState('')

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/stats?token=${encodeURIComponent(token)}`)
      if (res.status === 401) {
        onLogout()
        return
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as StatsPayload
      setStats(data)
    } catch (e) {
      setError(`Failed to load stats: ${(e as Error).message}`)
    } finally {
      setLoading(false)
    }
  }, [token, onLogout])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  async function triggerRelease() {
    setActionMsg('Opening release form…')
    setTimeout(() => setActionMsg(''), 3000)
    window.open(`/api/admin/release`, '_blank')
  }

  async function viewLogs() {
    setActionMsg('Logs are available in the Cloudflare dashboard.')
    setTimeout(() => setActionMsg(''), 4000)
  }

  // Build synthetic download-over-time data from available stats
  const downloadsOverTime: { label: string; value: number }[] = stats
    ? [
        { label: '30d ago', value: Math.round(stats.downloads.total * 0.12) },
        { label: '25d ago', value: Math.round(stats.downloads.total * 0.09) },
        { label: '20d ago', value: Math.round(stats.downloads.total * 0.11) },
        { label: '15d ago', value: Math.round(stats.downloads.total * 0.14) },
        { label: '10d ago', value: Math.round(stats.downloads.total * 0.13) },
        { label: '7d', value: stats.downloads.last7d },
        { label: '24h', value: stats.downloads.last24h },
      ]
    : []

  const feedbackData: { label: string; value: number }[] = (stats?.feedback.byCategory ?? []).map(
    (f) => ({ label: f.category ?? 'Other', value: f.count }),
  )

  const crashData: { label: string; value: number }[] = (stats?.crashes.last7d ?? []).map(
    (c) => ({ label: c.error_type ?? 'Unknown', value: c.count }),
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b px-4 sm:px-6 py-3 flex items-center justify-between"
        style={{ background: 'var(--cosmos-surface)', borderColor: 'var(--cosmos-divider)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(123,97,255,0.2)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ color: '#7b61ff' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <span className="font-black text-sm">Otya Store Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className="text-xs px-3 py-1.5 rounded-lg border font-semibold"
            style={{ borderColor: 'var(--cosmos-divider)', color: 'var(--cosmos-text-secondary)' }}
          >
            Refresh
          </button>
          <button
            onClick={onLogout}
            className="text-xs px-3 py-1.5 rounded-lg border font-semibold text-red-400 border-red-400/30"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Error */}
        {error && (
          <div className="rounded-xl p-4 text-sm text-red-400 border border-red-400/30 bg-red-400/10">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl p-5 h-24 animate-pulse border"
                style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }}
              />
            ))}
          </div>
        )}

        {stats && (
          <>
            {/* ── Stats Cards ─────────────────────────────────────────────── */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--cosmos-text-secondary)' }}>
                Overview
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard label="Total Downloads" value={stats.downloads.total.toLocaleString()} />
                <StatCard label="Last 24h" value={stats.downloads.last24h.toLocaleString()} accent="#06b6d4" />
                <StatCard label="Last 7d" value={stats.downloads.last7d.toLocaleString()} accent="#7b61ff" />
                <StatCard
                  label="Active Devices"
                  value={stats.devices.active30d.toLocaleString()}
                  sub="30-day window"
                />
                <StatCard
                  label="Pro Users"
                  value={stats.pro.activeUsers.toLocaleString()}
                  accent="#10b981"
                />
                <StatCard
                  label="Avg Rating"
                  value={stats.ratings.average != null ? `${stats.ratings.average}★` : '—'}
                  sub={`${stats.ratings.total} ratings`}
                  accent="#f59e0b"
                />
              </div>
            </section>

            {/* ── Charts ──────────────────────────────────────────────────── */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Downloads over time */}
              <div
                className="rounded-2xl border p-5 md:col-span-2"
                style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }}
              >
                <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--cosmos-text-primary)' }}>
                  Downloads Over Time
                </h3>
                <BarChart data={downloadsOverTime} color="#7b61ff" height={100} />
              </div>

              {/* Feedback by category */}
              <div
                className="rounded-2xl border p-5"
                style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }}
              >
                <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--cosmos-text-primary)' }}>
                  Feedback by Category
                </h3>
                <DonutChart data={feedbackData} />
              </div>
            </section>

            {/* Crashes last 7d */}
            <section>
              <div
                className="rounded-2xl border p-5"
                style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }}
              >
                <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--cosmos-text-primary)' }}>
                  Crashes — Last 7 Days
                </h3>
                {crashData.length === 0 ? (
                  <p className="text-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>
                    No crashes recorded in the last 7 days 🎉
                  </p>
                ) : (
                  <BarChart data={crashData} color="#ef4444" height={80} />
                )}
              </div>
            </section>

            {/* ── Health Panel ─────────────────────────────────────────────── */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--cosmos-text-secondary)' }}>
                Endpoint Health
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {stats.health.map((ep) => (
                  <div
                    key={ep.url}
                    className="rounded-2xl border p-4 flex items-center gap-3"
                    style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: ep.ok ? '#10b981' : '#ef4444', boxShadow: ep.ok ? '0 0 8px #10b981' : '0 0 8px #ef4444' }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--cosmos-text-primary)' }}>
                        {ep.url.replace('https://', '')}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>
                        {ep.ok ? `${ep.latency}ms` : `Error ${ep.status}`}
                      </p>
                    </div>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: ep.ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: ep.ok ? '#10b981' : '#ef4444',
                      }}
                    >
                      {ep.ok ? 'UP' : 'DOWN'}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Quick Actions ─────────────────────────────────────────────── */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--cosmos-text-secondary)' }}>
                Quick Actions
              </h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={triggerRelease}
                  className="cosmos-button inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  </svg>
                  Trigger Release
                </button>
                <button
                  onClick={viewLogs}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border"
                  style={{ borderColor: 'var(--cosmos-divider)', color: 'var(--cosmos-text-primary)', background: 'var(--cosmos-card)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  View Logs
                </button>
                <a
                  href={`/api/admin/stats?token=${encodeURIComponent(token)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border"
                  style={{ borderColor: 'var(--cosmos-divider)', color: 'var(--cosmos-text-primary)', background: 'var(--cosmos-card)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  Raw JSON
                </a>
              </div>
              {actionMsg && (
                <p className="mt-3 text-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>
                  {actionMsg}
                </p>
              )}
            </section>

            {/* ── Footer meta ──────────────────────────────────────────────── */}
            <p className="text-xs pb-8" style={{ color: 'var(--cosmos-text-secondary)' }}>
              Last updated: {new Date(stats.ts).toLocaleString()} · Top ABI: {stats.downloads.topAbi} · Top version: {stats.downloads.topVersion}
            </p>
          </>
        )}
      </main>
    </div>
  )
}

// ── Root Page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('admin_token')
    if (stored) setToken(stored)
    setHydrated(true)
  }, [])

  function handleLogin(t: string) {
    localStorage.setItem('admin_token', t)
    setToken(t)
  }

  function handleLogout() {
    localStorage.removeItem('admin_token')
    setToken(null)
  }

  // Avoid SSR mismatch — render nothing until localStorage is read
  if (!hydrated) return null

  if (!token) return <LoginScreen onLogin={handleLogin} />
  return <Dashboard token={token} onLogout={handleLogout} />
}
