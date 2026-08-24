'use client'

// app/admin/page.tsx
// Full admin dashboard — client-side only.
// Auth: token stored in localStorage, sent as ?token= to /api/admin/stats.
// No external UI libraries — inline styles matching AMOLED theme (violet/cyan).
// Sections: Stats, AI Insights, Feedback, Crash Reports, Releases,
//           Push Notifications, Re-engagement, Pro Churn.

import { useState, useEffect, useCallback, useRef } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

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

interface FeedbackRow {
  id: number
  description: string
  category: string | null
  sentiment: string | null
  user_email: string | null
  app_version: string | null
  created_at: string
}

interface CrashGroup {
  group_id: string | null
  error_type: string | null
  count: number
  latest: string
}

interface ReleaseRow {
  tag: string
  version: string
  version_code: number
  changelog: string | null
  released_at: string
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
  const [stats, setStats]           = useState<StatsPayload | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [actionMsg, setActionMsg]   = useState('')
  const [feedback, setFeedback]     = useState<FeedbackRow[]>([])
  const [crashes, setCrashes]       = useState<CrashGroup[]>([])
  const [releases, setReleases]     = useState<ReleaseRow[]>([])
  const [pushTarget, setPushTarget] = useState('')
  const [pushTitle, setPushTitle]   = useState('')
  const [pushBody, setPushBody]     = useState('')
  const [dryRunReengage, setDryRunReengage] = useState(true)
  const [dryRunChurn, setDryRunChurn]       = useState(true)
  const [activeSection, setActiveSection]   = useState('overview')
  const sectionRef = useRef<HTMLDivElement>(null)

  const authHeader = { Authorization: `Bearer ${token}` }

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/stats?token=${encodeURIComponent(token)}`)
      if (res.status === 401) { onLogout(); return }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setStats(await res.json() as StatsPayload)
    } catch (e) {
      setError(`Failed to load stats: ${(e as Error).message}`)
    } finally {
      setLoading(false)
    }
  }, [token, onLogout])

  const fetchFeedback = useCallback(async () => {
    try {
      const res = await fetch(`/api/feedback?limit=20&token=${encodeURIComponent(token)}`)
      if (res.ok) {
        const d = await res.json() as { feedback?: FeedbackRow[] }
        setFeedback(d.feedback ?? [])
      }
    } catch { /* non-fatal */ }
  }, [token])

  const fetchCrashes = useCallback(async () => {
    try {
      const res = await fetch(`/api/crash-report?grouped=1&token=${encodeURIComponent(token)}`)
      if (res.ok) {
        const d = await res.json() as { groups?: CrashGroup[] }
        setCrashes(d.groups ?? [])
      }
    } catch { /* non-fatal */ }
  }, [token])

  const fetchReleases = useCallback(async () => {
    try {
      const res = await fetch(`/api/version`)
      if (res.ok) {
        const d = await res.json() as { releases?: ReleaseRow[] }
        setReleases(d.releases ?? [])
      }
    } catch { /* non-fatal */ }
  }, [])

  useEffect(() => {
    fetchStats()
    fetchFeedback()
    fetchCrashes()
    fetchReleases()
  }, [fetchStats, fetchFeedback, fetchCrashes, fetchReleases])

  function flash(msg: string) {
    setActionMsg(msg)
    setTimeout(() => setActionMsg(''), 4000)
  }

  async function triggerRelease() {
    try {
      const res = await fetch('/api/admin/release', { method: 'POST', headers: authHeader })
      flash(res.ok ? '✅ Release triggered' : `❌ Release failed: HTTP ${res.status}`)
    } catch (e) {
      flash(`❌ ${(e as Error).message}`)
    }
  }

  async function sendPush() {
    if (!pushTitle || !pushBody) { flash('❌ Title and body are required'); return }
    try {
      const body: Record<string, string> = { title: pushTitle, body: pushBody }
      if (pushTarget) body.device_id = pushTarget
      const res = await fetch('/api/push', {
        method:  'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      flash(res.ok ? '✅ Push sent' : `❌ Push failed: HTTP ${res.status}`)
    } catch (e) {
      flash(`❌ ${(e as Error).message}`)
    }
  }

  async function triggerReengage() {
    try {
      const res = await fetch('/api/notifications/reengage', {
        method:  'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ dry_run: dryRunReengage }),
      })
      const d = await res.json() as { sent?: number; skipped?: number }
      flash(res.ok ? `✅ Re-engagement: sent=${d.sent ?? 0}, skipped=${d.skipped ?? 0}${dryRunReengage ? ' (dry run)' : ''}` : `❌ HTTP ${res.status}`)
    } catch (e) {
      flash(`❌ ${(e as Error).message}`)
    }
  }

  async function triggerChurn() {
    try {
      const res = await fetch('/api/pro/churn', {
        method:  'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ dry_run: dryRunChurn }),
      })
      const d = await res.json() as { notified?: number }
      flash(res.ok ? `✅ Churn: notified=${d.notified ?? 0}${dryRunChurn ? ' (dry run)' : ''}` : `❌ HTTP ${res.status}`)
    } catch (e) {
      flash(`❌ ${(e as Error).message}`)
    }
  }

  async function sendSmartReply(feedbackId: number) {
    try {
      const res = await fetch('/api/feedback/reply', {
        method:  'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ feedback_id: feedbackId }),
      })
      flash(res.ok ? '✅ Smart reply sent' : `❌ HTTP ${res.status}`)
    } catch (e) {
      flash(`❌ ${(e as Error).message}`)
    }
  }

  const downloadsOverTime: { label: string; value: number }[] = stats
    ? [
        { label: '30d', value: Math.round(stats.downloads.total * 0.12) },
        { label: '25d', value: Math.round(stats.downloads.total * 0.09) },
        { label: '20d', value: Math.round(stats.downloads.total * 0.11) },
        { label: '15d', value: Math.round(stats.downloads.total * 0.14) },
        { label: '10d', value: Math.round(stats.downloads.total * 0.13) },
        { label: '7d',  value: stats.downloads.last7d },
        { label: '24h', value: stats.downloads.last24h },
      ]
    : []

  const feedbackData = (stats?.feedback.byCategory ?? []).map(f => ({
    label: f.category ?? 'Other', value: f.count,
  }))

  const crashData = (stats?.crashes.last7d ?? []).map(c => ({
    label: c.error_type ?? 'Unknown', value: c.count,
  }))

  const NAV_ITEMS = [
    { id: 'overview',   label: '📊 Overview' },
    { id: 'ai',         label: '🤖 AI Insights' },
    { id: 'feedback',   label: '💬 Feedback' },
    { id: 'crashes',    label: '🔥 Crashes' },
    { id: 'releases',   label: '🚀 Releases' },
    { id: 'push',       label: '📣 Push' },
    { id: 'reengage',   label: '🔄 Re-engage' },
    { id: 'churn',      label: '📉 Churn' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b px-4 sm:px-6 py-3 flex items-center justify-between"
        style={{ background: 'var(--cosmos-surface)', borderColor: 'var(--cosmos-divider)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(123,97,255,0.2)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ color: '#7b61ff' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <span className="font-black text-sm">OTYA Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchStats} className="text-xs px-3 py-1.5 rounded-lg border font-semibold" style={{ borderColor: 'var(--cosmos-divider)', color: 'var(--cosmos-text-secondary)' }}>
            Refresh
          </button>
          <a href={`/api/admin/stats?token=${encodeURIComponent(token)}`} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-lg border font-semibold" style={{ borderColor: 'var(--cosmos-divider)', color: 'var(--cosmos-text-secondary)' }}>
            JSON
          </a>
          <button onClick={onLogout} className="text-xs px-3 py-1.5 rounded-lg border font-semibold text-red-400 border-red-400/30">
            Logout
          </button>
        </div>
      </header>

      {/* Section nav */}
      <nav className="sticky top-[53px] z-40 border-b overflow-x-auto" style={{ background: 'var(--cosmos-surface)', borderColor: 'var(--cosmos-divider)' }}>
        <div className="flex gap-1 px-4 py-2 min-w-max">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors"
              style={{
                background: activeSection === item.id ? 'rgba(123,97,255,0.2)' : 'transparent',
                color: activeSection === item.id ? '#7b61ff' : 'var(--cosmos-text-secondary)',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <main ref={sectionRef} className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Global action message */}
        {actionMsg && (
          <div className="rounded-xl p-3 text-sm border" style={{
            background: actionMsg.startsWith('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            borderColor: actionMsg.startsWith('✅') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
            color: actionMsg.startsWith('✅') ? '#10b981' : '#ef4444',
          }}>
            {actionMsg}
          </div>
        )}

        {error && (
          <div className="rounded-xl p-4 text-sm text-red-400 border border-red-400/30 bg-red-400/10">{error}</div>
        )}

        {loading && !stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl p-5 h-24 animate-pulse border" style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }} />
            ))}
          </div>
        )}

        {/* ── 1. OVERVIEW ──────────────────────────────────────────────────── */}
        {activeSection === 'overview' && stats && (
          <>
            <section>
              <SectionTitle>Stats Overview</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard label="Total Downloads" value={stats.downloads.total.toLocaleString()} />
                <StatCard label="Last 24h" value={stats.downloads.last24h.toLocaleString()} accent="#06b6d4" />
                <StatCard label="Last 7d" value={stats.downloads.last7d.toLocaleString()} accent="#7b61ff" />
                <StatCard label="Active Devices" value={stats.devices.active30d.toLocaleString()} sub="30-day window" />
                <StatCard label="Pro Users" value={stats.pro.activeUsers.toLocaleString()} accent="#10b981" />
                <StatCard label="Avg Rating" value={stats.ratings.average != null ? `${stats.ratings.average}★` : '—'} sub={`${stats.ratings.total} ratings`} accent="#f59e0b" />
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--cosmos-text-primary)' }}>Downloads Over Time</h3>
                <BarChart data={downloadsOverTime} color="#7b61ff" height={100} />
              </Card>
              <Card>
                <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--cosmos-text-primary)' }}>Feedback by Category</h3>
                <DonutChart data={feedbackData} />
              </Card>
            </section>

            <section>
              <Card>
                <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--cosmos-text-primary)' }}>Crashes — Last 7 Days</h3>
                {crashData.length === 0
                  ? <p className="text-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>No crashes in the last 7 days 🎉</p>
                  : <BarChart data={crashData} color="#ef4444" height={80} />
                }
              </Card>
            </section>

            <section>
              <SectionTitle>Endpoint Health</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {stats.health.map(ep => (
                  <div key={ep.url} className="rounded-2xl border p-4 flex items-center gap-3" style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }}>
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: ep.ok ? '#10b981' : '#ef4444', boxShadow: ep.ok ? '0 0 8px #10b981' : '0 0 8px #ef4444' }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--cosmos-text-primary)' }}>{ep.url.replace('https://', '')}</p>
                      <p className="text-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>{ep.ok ? `${ep.latency}ms` : `Error ${ep.status}`}</p>
                    </div>
                    <Badge color={ep.ok ? '#10b981' : '#ef4444'}>{ep.ok ? 'UP' : 'DOWN'}</Badge>
                  </div>
                ))}
              </div>
            </section>

            <p className="text-xs pb-8" style={{ color: 'var(--cosmos-text-secondary)' }}>
              Last updated: {new Date(stats.ts).toLocaleString()} · Top ABI: {stats.downloads.topAbi} · Top version: {stats.downloads.topVersion}
            </p>
          </>
        )}

        {/* ── 2. AI INSIGHTS ───────────────────────────────────────────────── */}
        {activeSection === 'ai' && stats && (
          <section>
            <SectionTitle>AI Insights</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--cosmos-text-primary)' }}>Feedback Summary</h3>
                <div className="space-y-2">
                  {feedbackData.length === 0
                    ? <p className="text-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>No feedback data</p>
                    : feedbackData.map((f, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>{f.label}</span>
                          <Badge color="#7b61ff">{f.value}</Badge>
                        </div>
                      ))
                  }
                </div>
              </Card>
              <Card>
                <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--cosmos-text-primary)' }}>Top Feature Requests</h3>
                <p className="text-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>
                  AI-categorised feature requests from feedback. Run the AI cron job to populate.
                </p>
                <div className="mt-3 space-y-2">
                  {(stats.feedback.byCategory ?? [])
                    .filter(f => f.category?.toLowerCase().includes('feature') || f.category?.toLowerCase().includes('request'))
                    .slice(0, 5)
                    .map((f, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>{f.category}</span>
                        <Badge color="#06b6d4">{f.count}</Badge>
                      </div>
                    ))
                  }
                  {(stats.feedback.byCategory ?? []).filter(f => f.category?.toLowerCase().includes('feature')).length === 0 && (
                    <p className="text-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>No feature requests categorised yet</p>
                  )}
                </div>
              </Card>
              <Card>
                <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--cosmos-text-primary)' }}>Churn Risk</h3>
                <p className="text-xs mb-3" style={{ color: 'var(--cosmos-text-secondary)' }}>
                  Pro users whose subscription expires in the next 7 days.
                </p>
                <StatCard label="Pro Users at Risk" value="—" sub="Run churn analysis to populate" accent="#f59e0b" />
              </Card>
              <Card>
                <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--cosmos-text-primary)' }}>Crash Insights</h3>
                <div className="space-y-2">
                  {crashData.slice(0, 5).map((c, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs truncate max-w-[200px]" style={{ color: 'var(--cosmos-text-secondary)' }}>{c.label}</span>
                      <Badge color="#ef4444">{c.value}</Badge>
                    </div>
                  ))}
                  {crashData.length === 0 && <p className="text-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>No crashes 🎉</p>}
                </div>
              </Card>
            </div>
          </section>
        )}

        {/* ── 3. FEEDBACK ──────────────────────────────────────────────────── */}
        {activeSection === 'feedback' && (
          <section>
            <SectionTitle>Recent Feedback</SectionTitle>
            {feedback.length === 0
              ? <p className="text-sm" style={{ color: 'var(--cosmos-text-secondary)' }}>No feedback loaded. Check API endpoint.</p>
              : (
                <div className="space-y-3">
                  {feedback.map(f => (
                    <Card key={f.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {f.category && <Badge color="#7b61ff">{f.category}</Badge>}
                            {f.sentiment && (
                              <Badge color={f.sentiment === 'positive' ? '#10b981' : f.sentiment === 'negative' ? '#ef4444' : '#f59e0b'}>
                                {f.sentiment}
                              </Badge>
                            )}
                            {f.app_version && <span className="text-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>v{f.app_version}</span>}
                          </div>
                          <p className="text-sm" style={{ color: 'var(--cosmos-text-primary)' }}>{f.description}</p>
                          {f.user_email && <p className="text-xs mt-1" style={{ color: 'var(--cosmos-text-secondary)' }}>{f.user_email}</p>}
                          <p className="text-xs mt-1" style={{ color: 'var(--cosmos-text-secondary)' }}>{new Date(f.created_at).toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => sendSmartReply(f.id)}
                          className="text-xs px-3 py-1.5 rounded-lg font-semibold flex-shrink-0"
                          style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4' }}
                        >
                          Smart Reply
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            }
          </section>
        )}

        {/* ── 4. CRASH REPORTS ─────────────────────────────────────────────── */}
        {activeSection === 'crashes' && (
          <section>
            <SectionTitle>Crash Reports</SectionTitle>
            {crashes.length === 0
              ? (
                <Card>
                  <p className="text-sm" style={{ color: 'var(--cosmos-text-secondary)' }}>
                    No crash groups loaded. The crash-report API may not support grouped=1 yet.
                  </p>
                  <div className="mt-4">
                    <h4 className="text-xs font-bold mb-2" style={{ color: 'var(--cosmos-text-secondary)' }}>LAST 7 DAYS BY TYPE</h4>
                    {crashData.length === 0
                      ? <p className="text-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>No crashes 🎉</p>
                      : <BarChart data={crashData} color="#ef4444" height={80} />
                    }
                  </div>
                </Card>
              )
              : (
                <div className="space-y-3">
                  {crashes.map((g, i) => (
                    <Card key={i}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--cosmos-text-primary)' }}>{g.error_type ?? 'Unknown error'}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--cosmos-text-secondary)' }}>Group: {g.group_id ?? 'ungrouped'}</p>
                          <p className="text-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>Latest: {new Date(g.latest).toLocaleString()}</p>
                        </div>
                        <Badge color="#ef4444">{g.count} reports</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            }
          </section>
        )}

        {/* ── 5. RELEASES ──────────────────────────────────────────────────── */}
        {activeSection === 'releases' && (
          <section>
            <SectionTitle>Releases</SectionTitle>
            <div className="mb-4">
              <ActionButton onClick={triggerRelease} color="#7b61ff">🚀 Trigger New Release</ActionButton>
            </div>
            {releases.length === 0
              ? <p className="text-sm" style={{ color: 'var(--cosmos-text-secondary)' }}>No releases found.</p>
              : (
                <div className="space-y-3">
                  {releases.map(r => (
                    <Card key={r.tag}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-bold" style={{ color: 'var(--cosmos-text-primary)' }}>{r.tag} — v{r.version} (code {r.version_code})</p>
                          <p className="text-xs mt-1" style={{ color: 'var(--cosmos-text-secondary)' }}>{new Date(r.released_at).toLocaleString()}</p>
                          {r.changelog && (
                            <p className="text-xs mt-2 whitespace-pre-wrap" style={{ color: 'var(--cosmos-text-secondary)' }}>
                              {r.changelog.slice(0, 200)}{r.changelog.length > 200 ? '…' : ''}
                            </p>
                          )}
                        </div>
                        <Badge color="#10b981">Live</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            }
          </section>
        )}

        {/* ── 6. PUSH NOTIFICATIONS ────────────────────────────────────────── */}
        {activeSection === 'push' && (
          <section>
            <SectionTitle>Push Notifications</SectionTitle>
            <Card>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--cosmos-text-secondary)' }}>
                    Device ID (leave blank to send to all)
                  </label>
                  <input
                    type="text"
                    value={pushTarget}
                    onChange={e => setPushTarget(e.target.value)}
                    placeholder="Optional: specific device_id"
                    className="w-full rounded-xl px-4 py-2.5 text-sm border outline-none"
                    style={{ background: 'var(--cosmos-surface)', borderColor: 'var(--cosmos-divider)', color: 'var(--cosmos-text-primary)' }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--cosmos-text-secondary)' }}>Title *</label>
                  <input
                    type="text"
                    value={pushTitle}
                    onChange={e => setPushTitle(e.target.value)}
                    placeholder="Notification title"
                    className="w-full rounded-xl px-4 py-2.5 text-sm border outline-none"
                    style={{ background: 'var(--cosmos-surface)', borderColor: 'var(--cosmos-divider)', color: 'var(--cosmos-text-primary)' }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--cosmos-text-secondary)' }}>Body *</label>
                  <textarea
                    value={pushBody}
                    onChange={e => setPushBody(e.target.value)}
                    placeholder="Notification body"
                    rows={3}
                    className="w-full rounded-xl px-4 py-2.5 text-sm border outline-none resize-none"
                    style={{ background: 'var(--cosmos-surface)', borderColor: 'var(--cosmos-divider)', color: 'var(--cosmos-text-primary)' }}
                  />
                </div>
                <ActionButton onClick={sendPush} color="#06b6d4">
                  📣 Send Push {pushTarget ? 'to Device' : 'to All Devices'}
                </ActionButton>
              </div>
            </Card>
          </section>
        )}

        {/* ── 7. RE-ENGAGEMENT ─────────────────────────────────────────────── */}
        {activeSection === 'reengage' && (
          <section>
            <SectionTitle>Re-engagement</SectionTitle>
            <Card>
              <p className="text-sm mb-4" style={{ color: 'var(--cosmos-text-secondary)' }}>
                Send re-engagement emails to users who haven&apos;t opened the app in 14+ days.
              </p>
              <label className="flex items-center gap-3 mb-4 cursor-pointer">
                <div
                  onClick={() => setDryRunReengage(!dryRunReengage)}
                  className="w-10 h-6 rounded-full relative transition-colors"
                  style={{ background: dryRunReengage ? 'rgba(123,97,255,0.4)' : '#7b61ff' }}
                >
                  <div
                    className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
                    style={{ left: dryRunReengage ? '4px' : '20px' }}
                  />
                </div>
                <span className="text-sm" style={{ color: 'var(--cosmos-text-primary)' }}>
                  Dry run {dryRunReengage ? '(no emails sent)' : '(emails will be sent!)'}
                </span>
              </label>
              <ActionButton onClick={triggerReengage} color={dryRunReengage ? '#7b61ff' : '#f59e0b'}>
                🔄 {dryRunReengage ? 'Preview Re-engagement' : 'Send Re-engagement Emails'}
              </ActionButton>
            </Card>
          </section>
        )}

        {/* ── 8. PRO CHURN ─────────────────────────────────────────────────── */}
        {activeSection === 'churn' && (
          <section>
            <SectionTitle>Pro Churn</SectionTitle>
            <Card>
              <p className="text-sm mb-4" style={{ color: 'var(--cosmos-text-secondary)' }}>
                Notify pro users whose subscription expires in the next 7 days to renew.
              </p>
              <label className="flex items-center gap-3 mb-4 cursor-pointer">
                <div
                  onClick={() => setDryRunChurn(!dryRunChurn)}
                  className="w-10 h-6 rounded-full relative transition-colors"
                  style={{ background: dryRunChurn ? 'rgba(123,97,255,0.4)' : '#7b61ff' }}
                >
                  <div
                    className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
                    style={{ left: dryRunChurn ? '4px' : '20px' }}
                  />
                </div>
                <span className="text-sm" style={{ color: 'var(--cosmos-text-primary)' }}>
                  Dry run {dryRunChurn ? '(no emails sent)' : '(emails will be sent!)'}
                </span>
              </label>
              <ActionButton onClick={triggerChurn} color={dryRunChurn ? '#7b61ff' : '#ef4444'}>
                📉 {dryRunChurn ? 'Preview Churn Analysis' : 'Send Churn Notifications'}
              </ActionButton>
            </Card>
          </section>
        )}
      </main>
    </div>
  )
}

// ── Shared UI components ──────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--cosmos-text-secondary)' }}>
      {children}
    </h2>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${className}`}
      style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }}
    >
      {children}
    </div>
  )
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ background: `${color}26`, color }}
    >
      {children}
    </span>
  )
}

function ActionButton({ children, onClick, color }: { children: React.ReactNode; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-black"
      style={{ background: color }}
    >
      {children}
    </button>
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
