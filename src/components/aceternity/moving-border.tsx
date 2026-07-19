'use client'
import { ReactNode } from 'react'

export function MovingBorder({ children, className = '', containerClassName = '' }: { children: ReactNode; className?: string; containerClassName?: string }) {
  return (
    <div className={`relative p-[1px] overflow-hidden rounded-2xl ${containerClassName}`}>
      <div className="absolute inset-0 rounded-2xl" style={{ background: 'linear-gradient(90deg, #8A2BE2, #00BFFF, #8A2BE2)', backgroundSize: '200% 100%', animation: 'moving-border 3s linear infinite' }} />
      <div className={`relative rounded-2xl ${className}`} style={{ background: 'var(--bg)' }}>{children}</div>
    </div>
  )
}
