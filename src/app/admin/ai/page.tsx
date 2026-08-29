import type { Metadata } from 'next'
import ConsoleClient from './ConsoleClient'

export const metadata: Metadata = {
  title: 'OTYA Command Center',
  description: 'Private OTYA conversational operations, support and administration workspace.',
  robots: { index: false, follow: false },
}

export default function OtyaCommandCenterPage() {
  return <ConsoleClient />
}
