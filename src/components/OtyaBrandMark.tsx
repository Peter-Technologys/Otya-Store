'use client'

import { useEffect, useState } from 'react'

type Props = {
  size?: number
  thinking?: boolean
  className?: string
  label?: string
}

function resolvedDark(): boolean {
  if (typeof document === 'undefined') return false
  const forced = document.documentElement.getAttribute('data-theme')
  if (forced === 'dark') return true
  if (forced === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** Standalone Otya mark. Never paints its own card, box, border or background. */
export function OtyaBrandMark({ size = 36, thinking = false, className = '', label }: Props) {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => setDark(resolvedDark())
    sync()
    media.addEventListener('change', sync)
    const observer = new MutationObserver(sync)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style'] })
    return () => {
      media.removeEventListener('change', sync)
      observer.disconnect()
    }
  }, [])

  const src = thinking
    ? dark ? '/otya-ai-thinking.svg' : '/otya-ai-thinking-light.svg'
    : dark ? '/otya-icon-dark.svg' : '/otya-icon.svg'

  return <img
    src={src}
    width={size}
    height={size}
    alt={label ?? ''}
    aria-label={label}
    className={`block shrink-0 object-contain ${className}`}
    style={{ width: size, height: size, background: 'transparent' }}
  />
}
