'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { databases } from '@/lib/appwrite'
import { Query } from 'appwrite'

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '6a19b3d90011d619c0cd'

interface BlogPost {
  $id: string; title: string; excerpt?: string; content: string; category?: string; authorName?: string; createdAt: string; isPublished: boolean
}

function formatDate(ts: string) {
  try { const d = new Date(isNaN(Number(ts)) ? ts : Number(ts)); return d.toLocaleDateString('en-UG', { day: 'numeric', month: 'long', year: 'numeric' }) } catch { return ts }
}

function readTime(content: string) { return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200)) }

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<BlogPost | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    databases.listDocuments(DB_ID, 'blog_posts', [Query.equal('isPublished', true), Query.orderDesc('createdAt'), Query.limit(50)])
      .then(r => setPosts(r.documents as unknown as BlogPost[]))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = posts.filter(p => search === '' || p.title.toLowerCase().includes(search.toLowerCase()) || (p.excerpt || '').toLowerCase().includes(search.toLowerCase()))

  if (selected) return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <nav className="sticky top-0 z-50 border-b backdrop-blur-2xl" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.92)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button onClick={() => setSelected(null)} className="text-sm font-medium" style={{ color: 'var(--text-sub)' }}>Blog</button>
          <span style={{ color: 'var(--border)' }}>/</span>
          <span className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{selected.title}</span>
        </div>
      </nav>
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl sm:text-4xl font-black mb-4" style={{ color: 'var(--text)' }}>{selected.title}</h1>
        <div className="flex items-center gap-4 mb-8 text-sm" style={{ color: 'var(--text-sub)' }}>
          <span>{formatDate(selected.createdAt)}</span>
          {selected.authorName && <span>by <strong style={{ color: 'var(--text)' }}>{selected.authorName}</strong></span>}
          <span>{readTime(selected.content)} min read</span>
        </div>
        <div className="prose prose-sm max-w-none leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text)' }}>{selected.content}</div>
        <div className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
          <button onClick={() => setSelected(null)} className="text-sm font-semibold" style={{ color: 'var(--purple)' }}>Back to Blog</button>
        </div>
      </article>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <nav className="sticky top-0 z-50 border-b backdrop-blur-2xl" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.92)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="font-bold text-sm" style={{ color: 'var(--text)' }}>PeterSmart Link</Link>
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Blog</span>
          <a href="https://wa.me/256775912582" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-semibold">WhatsApp</a>
        </div>
      </nav>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-4xl sm:text-5xl font-black mb-3" style={{ color: 'var(--text)' }}>Blog</h1>
        <div className="relative mb-8">
          <input type="text" placeholder="Search posts..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-11 pl-4 pr-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            style={{ background: 'var(--card)', borderColor: 'var(--card-border)', color: 'var(--text)' }} />
        </div>
        {loading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-36 rounded-2xl animate-pulse" style={{ background: 'var(--card)' }} />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-bold text-lg mb-2" style={{ color: 'var(--text)' }}>{search ? 'No posts found' : 'No posts yet'}</p>
            <p className="text-sm" style={{ color: 'var(--text-sub)' }}>Check back soon</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(p => (
              <button key={p.$id} onClick={() => setSelected(p)} className="w-full text-left">
                <div className="rounded-2xl border p-6 transition-all hover:shadow-lg hover:-translate-y-0.5" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
                  <div className="flex items-center gap-3 mb-1">
                    {p.category && <span className="text-[11px] font-bold uppercase" style={{ color: 'var(--purple)' }}>{p.category}</span>}
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(p.createdAt)}</span>
                  </div>
                  <h2 className="font-bold text-base sm:text-lg mb-2" style={{ color: 'var(--text)' }}>{p.title}</h2>
                  {p.excerpt && <p className="text-sm line-clamp-2" style={{ color: 'var(--text-sub)' }}>{p.excerpt}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
