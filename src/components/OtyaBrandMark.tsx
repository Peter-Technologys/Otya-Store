'use client'

import { useEffect, useState } from 'react'
import { OtyaAiMark } from './OtyaAiMark'

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

/**
 * Standalone Otya product mark.
 *
 * The full OTYA logo is always the product/brand identity. Legacy callers that
 * pass `thinking` are intentionally routed to the separate three-ball OTYA AI
 * mark so AI activity never animates or substitutes the full brand logo.
 *
 * At very small rendered sizes the canonical artwork loses its gradients,
 * hairline highlights and tiny satellite dots to pixel rounding. Use an
 * optically corrected micro asset at 28 px and below: same twisted-O silhouette,
 * solid high-contrast body, no hairline decoration, and larger colored dots.
 */
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

  if (thinking) {
    return <OtyaAiMark size={size} active label={label ?? 'Otya AI is working'} className={className} />
  }

  const micro = size <= 28
  const src = micro
    ? dark ? '/otya-icon-micro-dark.svg' : '/otya-icon-micro.svg'
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
