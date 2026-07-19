'use client'
export function BackgroundBeams({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="beam-grad" cx="50%" cy="0%" r="80%">
            <stop offset="0%" stopColor="#8A2BE2" stopOpacity="0.15" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="beam1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8A2BE2" stopOpacity="0" />
            <stop offset="50%" stopColor="#8A2BE2" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00BFFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="beam2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00BFFF" stopOpacity="0" />
            <stop offset="50%" stopColor="#00BFFF" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#8A2BE2" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#beam-grad)" />
        <line x1="20%" y1="0" x2="80%" y2="100%" stroke="url(#beam1)" strokeWidth="1" style={{ animation: 'beam-pulse 4s ease-in-out infinite' }} />
        <line x1="80%" y1="0" x2="20%" y2="100%" stroke="url(#beam2)" strokeWidth="1" style={{ animation: 'beam-pulse 4s ease-in-out infinite 2s' }} />
        <line x1="50%" y1="0" x2="50%" y2="100%" stroke="url(#beam1)" strokeWidth="0.5" style={{ animation: 'beam-pulse 6s ease-in-out infinite 1s' }} />
      </svg>
    </div>
  )
}
