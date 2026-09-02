'use client'

import { useEffect, useState } from 'react'
import {
  SpaceCard,
  SpaceLoading,
  SpaceMessage,
  SpacePage,
  SpaceReadOnly,
} from '@/components/SpaceSectionUi'

type BackupStatus = { has_backup?: boolean; last_backup_at?: string | null; error?: string }

export default function StoragePage() {
  const [status, setStatus] = useState<BackupStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    void fetch('/api/account-session/backup?status=1', {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    }).then(async response => {
      const data = await response.json().catch(() => ({})) as BackupStatus
      if (!response.ok) throw new Error(data.error || 'Could not load recovery status.')
      if (!cancelled) setStatus(data)
    }).catch(cause => {
      if (!cancelled) setError((cause as Error).message)
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  if (loading) return <SpaceLoading label="Loading recovery status…" />

  return <SpacePage title="Storage & recovery" subtitle="Otya recovery is deliberately narrow: account recovery metadata and playlist/media references may be backed up, while your actual media and Private files stay on your device.">
    {error && <SpaceMessage kind="error">{error}</SpaceMessage>}

    <div className="space-y-4">
      <SpaceCard title="Google Drive recovery" subtitle="The Android app requests Drive permission only when you choose backup or restore. Space reads only safe recovery metadata and never receives your Drive access token.">
        <div className="grid sm:grid-cols-2 gap-3">
          <SpaceReadOnly label="Recovery snapshot" value={status?.has_backup ? 'Backup recorded' : 'No backup recorded'} />
          <SpaceReadOnly label="Last backup" value={status?.last_backup_at ? formatDate(status.last_backup_at) : 'Not recorded'} />
        </div>
        <p className="mt-4 text-sm leading-6 otya-muted">Create, restore or delete the encrypted recovery snapshot from the Otya Android app, where Google Drive permission is explicitly requested. Space does not ask for broad Drive access merely to show this status.</p>
      </SpaceCard>

      <SpaceCard title="What is not uploaded" subtitle="Local-first remains the v1.0.0 rule.">
        <div className="grid sm:grid-cols-2 gap-3">
          <SpaceReadOnly label="Music & video files" value="Stay on your device" />
          <SpaceReadOnly label="Private media" value="Stay in app-private storage" />
          <SpaceReadOnly label="Passwords / OTPs / tokens" value="Forbidden from recovery snapshot" />
          <SpaceReadOnly label="Recovery snapshot" value="Encrypted before Drive storage" />
        </div>
      </SpaceCard>
    </div>
  </SpacePage>
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recorded previously'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}
