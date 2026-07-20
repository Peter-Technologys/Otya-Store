'use client'
import dynamic from 'next/dynamic'

const Spotlight            = dynamic(() => import('@/components/aceternity/spotlight').then(m => ({ default: m.Spotlight })), { ssr: false })
const TypewriterEffect     = dynamic(() => import('@/components/aceternity/typewriter-effect').then(m => ({ default: m.TypewriterEffect })), { ssr: false })
const MovingBorder         = dynamic(() => import('@/components/aceternity/moving-border').then(m => ({ default: m.MovingBorder })), { ssr: false })
const BackgroundBeams      = dynamic(() => import('@/components/aceternity/background-beams').then(m => ({ default: m.BackgroundBeams })), { ssr: false })
const CardSpotlight        = dynamic(() => import('@/components/aceternity/card-spotlight').then(m => ({ default: m.CardSpotlight })), { ssr: false })
const AnimatedGradientText = dynamic(() => import('@/components/magicui/animated-gradient-text').then(m => ({ default: m.AnimatedGradientText })), { ssr: false })

export { Spotlight, TypewriterEffect, MovingBorder, BackgroundBeams, CardSpotlight, AnimatedGradientText }
