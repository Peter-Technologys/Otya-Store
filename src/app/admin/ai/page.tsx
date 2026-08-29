import type { Metadata } from 'next'
import ConsoleClient from './ConsoleClient'

export const metadata: Metadata = {
  title: 'OTYA Admin',
  description: 'Private OTYA operations, support and administration console.',
  robots: { index: false, follow: false },
}

export default function OtyaConsolePage(){
  return <ConsoleClient />
}
