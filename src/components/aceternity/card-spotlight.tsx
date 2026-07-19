'use client'
import { ReactNode, useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

export function CardSpotlight({ children, className = '' }: { children: ReactNode; className?: string }) {
  const divRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return
    const rect = divRef.current.getBoundingClientRect()
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    setOpacity(1)
  }, [])

  return (
    <div ref={divRef} onMouseMove={handleMouseMove} onMouseLeave={() => setOpacity(0)}
      className={cn('group relative overflow-hidden rounded-2xl border p-6 transition-all hover:shadow-xl hover:-translate-y-1', className)}
      style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
      <div className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{ background: `radial-gradient(300px circle at ${position.x}px ${position.y}px, rgba(138,43,226,0.12), transparent 60%)`, opacity }} />
      {children}
    </div>
  )
}
