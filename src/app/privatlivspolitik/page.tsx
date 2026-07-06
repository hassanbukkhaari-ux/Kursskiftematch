import type { Metadata } from 'next'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'

export const metadata: Metadata = {
  title: 'Privatlivspolitik | Kursskifte',
  description:
    'Læs hvordan Kursskifte behandler personoplysninger i overensstemmelse med GDPR.',
  alternates: { canonical: '/privatlivspolitik' },
}

export default function PrivatlivspolitikPage() {
  return (
    <div className="min-h-screen bg-[#F6F3EE]">
      <PublicNav />
      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
        <h1 className="font-serif text-3xl font-bold text-[#1C3829] mb-4">
          Privatlivspolitik
        </h1>
        <p className="text-sm text-[#6B7569] leading-relaxed">
          Kursskifte ApS behandler personoplysninger i overensstemmelse med
          databeskyttelsesforordningen (GDPR) og dansk databeskyttelseslovgivning.
          Den fulde privatlivspolitik offentliggøres her. Har du spørgsmål til
          vores behandling af personoplysninger, kan du kontakte os på{' '}
          <a href="mailto:info@kursskifte.dk" className="text-[#1C3829] underline">
            info@kursskifte.dk
          </a>
          .
        </p>
      </main>
      <PublicFooter />
    </div>
  )
}
