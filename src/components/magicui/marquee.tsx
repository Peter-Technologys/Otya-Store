import { ReactNode } from 'react'

export function Marquee({ children, reverse = false }: { children: ReactNode; reverse?: boolean }) {
  return (
    <div className="relative flex overflow-hidden">
      <div className="flex min-w-full shrink-0 gap-4 py-2" style={{ animation: `${reverse ? 'marquee-reverse' : 'marquee'} 30s linear infinite` }}>{children}</div>
      <div aria-hidden className="flex min-w-full shrink-0 gap-4 py-2" style={{ animation: `${reverse ? 'marquee-reverse' : 'marquee'} 30s linear infinite` }}>{children}</div>
    </div>
  )
}
