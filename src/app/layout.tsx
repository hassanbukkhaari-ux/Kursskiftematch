import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://kursskifte.dk'),
  title: {
    template: '%s | Kursskifte',
    default: 'Kursskifte | Kvalitetssikrede kontaktpersoner til kommuner',
  },
  description:
    'Kursskifte matcher kommuner med kvalitetssikrede kontaktpersoner til §52- og §85-forløb. Faglig anbefaling, dokumenteret og GDPR-compliant. Vi betjener kommuner i Nordjylland — bl.a. Aalborg, Hjørring og Brønderslev.',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da">
      <body>{children}</body>
    </html>
  )
}
