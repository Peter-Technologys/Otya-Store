'use client'

import React from 'react'
import Link from 'next/link'
import { SiteNav as CanonicalSiteNav } from '@/components/SiteNav'

export function SiteNav({ back }: { back?: { href: string; label: string } }) {
  return <>
    <CanonicalSiteNav />
    {back && <div className="otya-shell pt-4"><Link href={back.href} className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold otya-quiet-button">← {back.label}</Link></div>}
  </>
}

export function PageWrapper({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`min-h-screen otya-ambient ${className}`} style={{ color: 'var(--cosmos-text-primary)' }}>{children}</div>
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`modern-card p-5 sm:p-7 ${className}`}>{children}</div>
}

export function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return <header className="mb-8 sm:mb-10">
    <h1 className="text-[2.15rem] leading-[1.02] font-black tracking-[-.055em] sm:text-5xl">{title}</h1>
    {subtitle && <p className="mt-3 max-w-2xl text-[15px] leading-6 otya-muted sm:text-base">{subtitle}</p>}
  </header>
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`rounded-[24px] animate-pulse ${className}`} style={{ background: 'var(--cosmos-card)' }} />
}
