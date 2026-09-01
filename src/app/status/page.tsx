import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'OTYA Status',
  description: 'Safe public status information for OTYA services.',
  robots: { index: true, follow: true },
}

export default function StatusPage() {
  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '72px 22px 96px' }}>
      <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', opacity: .62 }}>
        PeterSmart Link · OTYA
      </p>
      <h1 style={{ fontSize: 'clamp(2.4rem, 8vw, 4.8rem)', lineHeight: 1, margin: '14px 0 18px' }}>
        Status
      </h1>
      <p style={{ fontSize: 18, lineHeight: 1.6, maxWidth: 620, opacity: .78 }}>
        This is OTYA&apos;s public status surface. It intentionally does not expose private infrastructure,
        account data, logs, secrets, resource identifiers, or internal diagnostics.
      </p>

      <section style={{ marginTop: 42, padding: 24, border: '1px solid currentColor', borderRadius: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 999, background: '#22c55e', display: 'inline-block' }} />
          <strong>Public status page is reachable</strong>
        </div>
        <p style={{ margin: '12px 0 0', lineHeight: 1.55, opacity: .72 }}>
          A reachable page confirms the public OTYA edge is responding. Individual account, AI, email,
          music-provider, or release operations can still have separate availability.
        </p>
      </section>

      <section style={{ marginTop: 34 }}>
        <h2 style={{ fontSize: 22 }}>Useful checks</h2>
        <ul style={{ lineHeight: 1.9, paddingLeft: 22 }}>
          <li><a href="https://petersmartlink.com/">OTYA website</a></li>
          <li><a href="https://petersmartlink.com/latest">Current public release state</a></li>
          <li><a href="https://docs.petersmartlink.com/">OTYA help and documentation</a></li>
        </ul>
      </section>

      <p style={{ marginTop: 42, fontSize: 13, lineHeight: 1.6, opacity: .62 }}>
        No private monitoring data is published here. For account-specific help, use OTYA Support.
      </p>
    </main>
  )
}
