'use client'

import { useEffect } from 'react'
import Script from 'next/script'

// Google Ads/Analytics tag using Google's "Consent Mode" pattern: the tag
// itself always loads (so Google's own verification tools can find it, and
// so returning visitors who already accepted get tracked immediately) but
// starts in a fully denied consent state — no cookies, no storage, no data
// collection — until the visitor accepts in the cookie banner. Declining,
// or not having decided yet, keeps everything denied.
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

function hasConsent(): boolean {
  try {
    return localStorage.getItem('cookie-consent') === 'accepted'
  } catch {
    return false
  }
}

export default function GoogleTag() {
  const gtagId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID

  useEffect(() => {
    function applyConsent() {
      const granted = hasConsent() ? 'granted' : 'denied'
      window.gtag?.('consent', 'update', {
        ad_storage: granted,
        ad_user_data: granted,
        ad_personalization: granted,
        analytics_storage: granted,
      })
    }
    applyConsent()
    window.addEventListener('cookie-consent-changed', applyConsent)
    return () => window.removeEventListener('cookie-consent-changed', applyConsent)
  }, [])

  if (!gtagId) return null

  return (
    <>
      {/* Default consent state — must run before gtag.js itself, hence
          beforeInteractive, so Google never collects anything ahead of an
          explicit choice. */}
      <Script id="google-tag-consent-default" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied',
          });
        `}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`} strategy="afterInteractive" />
      <Script id="google-tag-init" strategy="afterInteractive">
        {`
          gtag('js', new Date());
          gtag('config', '${gtagId}');
        `}
      </Script>
    </>
  )
}
