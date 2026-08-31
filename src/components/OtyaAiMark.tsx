'use client'

type Props = { size?: number; active?: boolean; label?: string; className?: string }

export function OtyaAiMark({ size = 32, active = false, label = 'Otya AI', className = '' }: Props) {
  const dot = Math.max(5, Math.round(size * 0.24))
  return <span
    role="img"
    aria-label={label}
    className={`relative inline-block shrink-0 ${className}`}
    style={{ width: size, height: size }}
  >
    <span className={active ? 'otya-ai-dot otya-ai-dot-a' : ''} style={{ position:'absolute', width:dot, height:dot, borderRadius:999, background:'#4285F4', left:'12%', top:'18%' }} />
    <span className={active ? 'otya-ai-dot otya-ai-dot-b' : ''} style={{ position:'absolute', width:dot, height:dot, borderRadius:999, background:'#EA4335', right:'12%', top:'18%' }} />
    <span className={active ? 'otya-ai-dot otya-ai-dot-c' : ''} style={{ position:'absolute', width:dot, height:dot, borderRadius:999, background:'#FBBC05', left:'50%', bottom:'10%', transform:'translateX(-50%)' }} />
    <style jsx>{`
      .otya-ai-dot { animation: otya-ai-orbit 1.8s ease-in-out infinite; transform-origin: 50% 145%; }
      .otya-ai-dot-b { animation-delay: -0.6s; }
      .otya-ai-dot-c { animation-delay: -1.2s; transform-origin: 50% -70%; }
      @keyframes otya-ai-orbit {
        0%,100% { translate: 0 0; scale: 1; }
        25% { translate: 3px -2px; scale: .92; }
        50% { translate: 0 3px; scale: 1.04; }
        75% { translate: -3px -1px; scale: .96; }
      }
      @media (prefers-reduced-motion: reduce) { .otya-ai-dot { animation: none; } }
    `}</style>
  </span>
}
