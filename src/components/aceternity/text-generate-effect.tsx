'use client'
import React, { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'

export function TextGenerateEffect({ text, className = '', style }: { text: string; className?: string; style?: React.CSSProperties }) {
  const [words, setWords] = useState<{ word: string; visible: boolean }[]>([])
  const ref = useRef<HTMLParagraphElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const wordList = text.split(' ').map(w => ({ word: w, visible: false }))
    setWords(wordList)
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        wordList.forEach((_, i) => {
          setTimeout(() => { setWords(prev => prev.map((w, j) => (j === i ? { ...w, visible: true } : w))) }, i * 60)
        })
      }
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [text])

  return (
    <p ref={ref} className={cn('leading-relaxed', className)} style={style}>
      {words.map((w, i) => (
        <span key={i} className="transition-all duration-300" style={{ opacity: w.visible ? 1 : 0, filter: w.visible ? 'blur(0)' : 'blur(4px)', display: 'inline-block', marginRight: '0.25em', transform: w.visible ? 'translateY(0)' : 'translateY(8px)' }}>{w.word}</span>
      ))}
    </p>
  )
}
