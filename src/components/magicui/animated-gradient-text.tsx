'use client'
import { ReactNode } from 'react'

export function AnimatedGradientText({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex bg-clip-text text-transparent ${className}`}
      style={{ background: 'linear-gradient(90deg, #8A2BE2, #00BFFF, #8A2BE2)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'gradient-shift 3s linear infinite' }}>
      {children}
    </span>
  )
}
