'use client'

import React from 'react'
import Link from 'next/link'
import { SiteNav as CanonicalSiteNav } from '@/components/SiteNav'

export function SiteNav({ back }: { back?: { href: string; label: string } }) {
  return <>
    <CanonicalSiteNav />
    {back && <div className="otya-shell pt-3"><Link href={back.href} className="text-sm font-semibold otya-muted">← {back.label}</Link></div>}
  </>
}

export function PageWrapper({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`min-h-screen otya-ambient ${className}`} style={{ color: 'var(--cosmos-text-primary)' }}>{children}</div>
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`modern-card p-6 ${className}`}>{children}</div>
}

export function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return <div className="mb-7"><h1 className="text-3xl font-extrabold tracking-[-.04em]">{title}</h1>{subtitle && <p className="mt-2 text-sm otya-muted">{subtitle}</p>}</div>
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`rounded-2xl animate-pulse ${className}`} style={{ background: 'var(--cosmos-card)' }} />
}
