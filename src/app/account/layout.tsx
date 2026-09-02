import { ReactNode } from 'react'
import { OtyaSpaceGate } from '@/components/OtyaSpaceGate'

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <OtyaSpaceGate>{children}</OtyaSpaceGate>
}
