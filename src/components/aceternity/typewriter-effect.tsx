'use client'
import { useEffect, useState } from 'react'

export function TypewriterEffect({ words, className = '' }: { words: string[]; className?: string }) {
  const [wordIndex, setWordIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const [text, setText] = useState('')

  useEffect(() => {
    const current = words[wordIndex]
    const timeout = setTimeout(() => {
      if (!deleting) {
        setText(current.slice(0, charIndex + 1))
        if (charIndex + 1 === current.length) { setTimeout(() => setDeleting(true), 1800) }
        else { setCharIndex(c => c + 1) }
      } else {
        setText(current.slice(0, charIndex - 1))
        if (charIndex - 1 === 0) { setDeleting(false); setWordIndex(i => (i + 1) % words.length); setCharIndex(0) }
        else { setCharIndex(c => c - 1) }
      }
    }, deleting ? 40 : 80)
    return () => clearTimeout(timeout)
  }, [charIndex, deleting, wordIndex, words])

  return <span className={className}>{text}<span className="animate-pulse" style={{ color: '#8A2BE2' }}>|</span></span>
}
