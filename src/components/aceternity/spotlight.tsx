'use client'
import { useRef, useState, useCallback } from 'react'

export function Spotlight({ className = '' }: { className?: string }) {
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
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{ background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(138,43,226,0.15), transparent 40%)`, opacity, transition: 'opacity 0.3s' }} />
  )
}
