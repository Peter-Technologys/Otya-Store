'use client'
import { useEffect, useState } from 'react'
import type { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { databases } from '@/lib/appwrite'
import { Query } from 'appwrite'

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '6a19b3d90011d619c0cd'

interface Service { $id: string; name: string; description: string; price?: number }

const DEFAULT_SERVICES: Service[] = [
  { $id: '1', name: 'Mobile Money — MTN & Airtel', description: 'Deposits, withdrawals, transfers and bill payments. Fast and reliable every day.', price: 0 },
  { $id: '2', name: 'Phone Loans', description: 'Get a smartphone on loan with easy weekly repayments. No collateral needed.', price: 0 },
  { $id: '3', name: 'Phone Screen Replacement', description: 'Cracked screen? We replace screens for most Android brands. Same-day service.', price: 35000 },
  { $id: '4', name: 'Phone Repairs', description: 'Battery, charging port, water damage, speaker and microphone repairs. Free diagnosis.', price: 15000 },
  { $id: '5', name: 'Data Bundles & Airtime', description: 'MTN and Airtel data bundles and airtime top-up at competitive rates.', price: 0 },
  { $id: '6', name: 'Phone Sales', description: 'Latest smartphones and accessories at the best prices in Mbirizi.', price: 150000 },
]

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES)

  useEffect(() => {
    databases.listDocuments(DB_ID, 'services', [Query.equal('isPublished', true), Query.limit(50)])
      .then(r => { const docs = r.documents as unknown as Service[]; if (docs.length > 0) setServices(docs) })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <SiteNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--text)' }}>Our Services</h1>
          <p className="text-sm" style={{ color: 'var(--text-sub)' }}>Professional tech and finance services in Mbirizi, Lwengo District</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {services.map(s => (
            <div key={s.$id} className="p-5 rounded-2xl border transition-all hover:shadow-lg hover:-translate-y-0.5 hover:border-purple-200"
              style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
              <h3 className="font-bold text-sm mb-2" style={{ color: 'var(--text)' }}>{s.name}</h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-sub)' }}>{s.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: 'var(--purple)' }}>
                  {s.price && s.price > 0 ? `From UGX ${s.price.toLocaleString()}` : 'Free / Ask us'}
                </span>
                <a href={`https://wa.me/256775912582?text=Hi! I need: ${encodeURIComponent(s.name)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-transform hover:scale-105"
                  style={{ background: '#25d366' }}>Enquire</a>
              </div>
            </div>
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
