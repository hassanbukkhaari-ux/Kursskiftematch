'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="da">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#F6F3EE', color: '#1A1F1C' }}>
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%', background: '#FEF2F2',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Noget gik galt
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#6B7569', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              Der opstod en uventet fejl. Prøv at genindlæse siden.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '0.5rem 1.5rem', background: '#1C3829', color: 'white',
                borderRadius: '0.75rem', border: 'none', fontSize: '0.875rem',
                fontWeight: '600', cursor: 'pointer',
              }}
            >
              Prøv igen
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
