import { permanentRedirect } from 'next/navigation'

export default function LegacyAppsPage() {
  permanentRedirect('/otya-player')
}
