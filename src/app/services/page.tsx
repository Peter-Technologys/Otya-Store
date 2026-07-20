'use client'
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SiteNav, PageWrapper, Card, SectionHeading, Skeleton } from '@/components/ui'
import { databases } from '@/lib/appwrite'
import { Query } from 'appwrite'

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '6a19b3d90011d619c0cd'

interface Service { $id: string; name: string; description: string; price?: number }

const defaultServices: Service[] = [
  { $id: '1', name: 'Mobile Money - MTN & Airtel', description: 'Deposits, withdrawals, transfers and bill payments. Fast, reliable, every day.', price: 0 },
  { $id: '2', name: 'Phone Loans (Watu Credit)', description: 'Get a smartphone on loan with easy weekly repayments. No collateral needed.', price: 0 },
  { $id: '3', name: 'Phone Screen Replacement', description: 'Cracked screen? We replace screens for most Android brands. Same-day service.', price: 35000 },
  { $id: '4', name: 'Phone Repairs (General)', description: 'Battery, charging port, water damage, speaker and microphone repairs. Diagnosis is free.', price: 15000 },
  { $id: '5', name: 'Data Bundles & Airtime', description: 'MTN and Airtel data bundles and airtime top-up at competitive rates.', price: 0 },
  { $id: '6', name: 'Phone Sales', description: 'Latest smartphones and accessories at the best prices in Mbirizi.', price: 150000 },
]

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>(defaultServices)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    databases.listDocuments(DB_ID, 'services', [Query.equal('isPublished', true), Query.limit(50)])
      .then(r => { const docs = r.documents as unknown as Service[]; if (docs.length > 0) setServices(docs) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageWrapper>
      <SiteNav back={{ href: '/', label: 'PeterSmart Link' }} />
      <div className="max-w-4xl mx-auto px-6 py-12">
        <SectionHeading title="Our Services" subtitle="Professional tech and finance services in Mbirizi, Lwengo District" />
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">{[...Array(4)].map((_, i) => <div key={i}><Skeleton className="h-36" /></div>)}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {services.map(s => (
              <div key={s.$id}>
                <Card className="hover:shadow-lg">
                  <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text)' }}>{s.name}</h3>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-sub)' }}>{s.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-600 font-semibold text-sm">{s.price && s.price > 0 ? `From UGX ${s.price.toLocaleString()}` : 'Free / Ask us'}</span>
                    <a href={`https://wa.me/256775912582?text=Hi! I need: ${encodeURIComponent(s.name)}`} target="_blank" rel="noopener noreferrer" className="text-green-600 text-sm font-medium hover:text-green-500">Enquire</a>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
