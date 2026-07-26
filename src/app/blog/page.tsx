'use client'
import { useEffect, useState } from 'react'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

interface BlogPost {
  $id: string; title: string; excerpt?: string; content: string
  category?: string; authorName?: string; createdAt: string; isPublished: boolean
}

function formatDate(ts: string) {
  try {
    const d = new Date(isNaN(Number(ts)) ? ts : Number(ts))
    return d.toLocaleDateString('en-UG', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return ts }
}

function readTime(content: string) {
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200))
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<BlogPost | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/blog')
      .then(r => r.json())
      .then((data: { posts: BlogPost[] }) => setPosts(data.posts ?? []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = posts.filter(p =>
    search === '' ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.excerpt || '').toLowerCase().includes(search.toLowerCase())
  )

  if (selected) return (
    <div className="min-h-screen relative" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
      <div className="cosmos-stars" />
      <SiteNav />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 relative z-10">
        <button onClick={() => setSelected(null)}
          className="inline-flex items-center gap-1 text-sm font-semibold mb-8 transition-colors hover:text-purple-400"
          style={{ color: 'var(--cosmos-primary)' }}>
          ← Back to Blog
        </button>
        <h1 className="text-3xl sm:text-4xl font-black mb-4" style={{ color: 'var(--cosmos-text-primary)' }}>{selected.title}</h1>
        <div className="flex flex-wrap items-center gap-4 mb-8 text-sm" style={{ color: 'var(--cosmos-text-secondary)' }}>
          <span>{formatDate(selected.createdAt)}</span>
          {selected.authorName && <span>by <strong style={{ color: 'var(--cosmos-text-primary)' }}>{selected.authorName}</strong></span>}
          <span>{readTime(selected.content)} min read</span>
          {selected.category && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'var(--cosmos-surface)', color: 'var(--cosmos-primary)' }}>{selected.category}</span>
          )}
        </div>
        <div className="prose prose-sm max-w-none leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--cosmos-text-primary)' }}>
          {selected.content}
        </div>
      </article>
      <SiteFooter />
    </div>
  )

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--cosmos-scaffold)', color: 'var(--cosmos-text-primary)' }}>
      <div className="cosmos-stars" />
      <SiteNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black mb-2" style={{ color: 'var(--cosmos-text-primary)' }}>Blog</h1>
          <p className="text-sm" style={{ color: 'var(--cosmos-text-secondary)' }}>News, updates and stories from PeterSmart Technologies</p>
        </div>
        <input type="text" placeholder="Search posts..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full h-11 px-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 mb-8"
          style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)', color: 'var(--cosmos-text-primary)' }} />
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 rounded-2xl animate-pulse" style={{ background: 'var(--cosmos-card)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-4xl mb-4">📝</p>
            <p className="font-bold text-lg mb-2" style={{ color: 'var(--cosmos-text-primary)' }}>{search ? 'No posts found' : 'No posts yet'}</p>
            <p className="text-sm" style={{ color: 'var(--cosmos-text-secondary)' }}>Check back soon</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(p => (
              <button key={p.$id} onClick={() => setSelected(p)} className="w-full text-left">
                <div className="rounded-2xl border p-6 transition-all hover:shadow-lg hover:-translate-y-0.5 hover:border-purple-400"
                  style={{ background: 'var(--cosmos-card)', borderColor: 'var(--cosmos-divider)' }}>
                  <div className="flex items-center gap-3 mb-2">
                    {p.category && (
                      <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--cosmos-surface)', color: 'var(--cosmos-primary)' }}>{p.category}</span>
                    )}
                    <span className="text-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>{formatDate(p.createdAt)}</span>
                    <span className="text-xs" style={{ color: 'var(--cosmos-text-secondary)' }}>{readTime(p.content)} min read</span>
                  </div>
                  <h2 className="font-bold text-base sm:text-lg mb-2" style={{ color: 'var(--cosmos-text-primary)' }}>{p.title}</h2>
                  {p.excerpt && <p className="text-sm line-clamp-2" style={{ color: 'var(--cosmos-text-secondary)' }}>{p.excerpt}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  )
}
