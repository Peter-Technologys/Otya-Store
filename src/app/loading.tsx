import { OtyaBrandMark } from '@/components/OtyaBrandMark'

export default function Loading() {
  return (
    <main
      className="min-h-[100dvh] grid place-items-center px-6"
      style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}
    >
      <div className="text-center" role="status" aria-live="polite">
        <OtyaBrandMark ai thinking size={72} label="Next is getting Otya ready" />
        <div className="mt-4 text-sm font-bold">Otya</div>
        <div className="mt-1 text-xs otya-muted">Next is getting things ready…</div>
      </div>
    </main>
  )
}
