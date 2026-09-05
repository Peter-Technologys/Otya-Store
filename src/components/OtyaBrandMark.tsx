'use client'

type Props = {
  size?: number
  thinking?: boolean
  ai?: boolean
  className?: string
  label?: string
}

/**
 * Canonical Otya identity component.
 *
 * Every product surface, including Next, uses the exact approved Otya mark
 * synced from the OtyaPlayer app. Thinking state may animate the same mark;
 * it never swaps to a second logo or alternate identity.
 */
export function OtyaBrandMark({ size = 36, thinking = false, ai = false, className = '', label }: Props) {
  const accessibleLabel = label ?? (ai ? "Next, Otya's assistant" : '')
  return <img
    src="/otya-mark-current.png"
    width={size}
    height={size}
    alt={accessibleLabel}
    aria-label={accessibleLabel || undefined}
    className={`block shrink-0 object-contain ${thinking ? 'otya-brand-thinking' : ''} ${className}`}
    style={{ width: size, height: size, background: 'transparent' }}
  />
}
