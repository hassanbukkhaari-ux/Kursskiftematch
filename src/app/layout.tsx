import type { Metadata } from 'next'
import './globals.css'
import CookieBanner from '@/components/public/CookieBanner'

export const metadata: Metadata = {
  metadataBase: new URL('https://kursskifte.dk'),
  title: {
    template: '%s | Kursskifte',
    default: 'Kursskifte | Kvalitetssikrede kontaktpersoner til kommuner',
  },
  description:
    'Kursskifte matcher kommuner med kvalitetssikrede kontaktpersoner til §32 og §85-forløb. Faglig anbefaling, dokumenteret og GDPR-compliant. Vi betjener kommuner i Nordjylland — bl.a. Aalborg, Hjørring og Brønderslev.',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.json',
  openGraph: {
    siteName: 'Kursskifte',
    locale: 'da_DK',
    type: 'website',
  },
  twitter: {
    card: 'summary',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Kursskifte ApS',
  url: 'https://kursskifte.dk',
  email: 'kontakt@kursskifte.dk',
  telephone: '+4571420376',
  description:
    'Kursskifte forbinder kommuner i Nordjylland med kvalitetssikrede kontaktpersoner til §32 og §85-forløb — socialpædagogisk støtte, bostøtte og relationsbaseret indsats.',
  areaServed: [
    { '@type': 'City', name: 'Aalborg' },
    { '@type': 'City', name: 'Hjørring' },
    { '@type': 'City', name: 'Brønderslev' },
    { '@type': 'City', name: 'Frederikshavn' },
  ],
  address: {
    '@type': 'PostalAddress',
    addressRegion: 'Nordjylland',
    addressCountry: 'DK',
  },
  serviceArea: {
    '@type': 'AdministrativeArea',
    name: 'Nordjylland',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        {children}
        <CookieBanner />
      </body>
    </html>
  )
}
