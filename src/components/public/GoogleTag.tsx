'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

// Google Ads/Analytics tag — only loads once the visitor has accepted
// cookies (never on "Afvis" or before a choice is made). Listens for the
// custom event CookieBanner fires so accepting loads it immediately,
// without needing a page reload.
function hasConsent(): boolean {
  try {
    return localStorage.getItem('cookie-consent') === 'accepted'
  } catch {
    return false
  }
}

export default function GoogleTag() {
  const [consented, setConsented] = useState(false)
  const gtagId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID

  useEffect(() => {
    setConsented(hasConsent())
    function onConsentChange() { setConsented(hasConsent()) }
    window.addEventListener('cookie-consent-changed', onConsentChange)
    return () => window.removeEventListener('cookie-consent-changed', onConsentChange)
  }, [])

  if (!gtagId || !consented) return null

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`} strategy="afterInteractive" />
      <Script id="google-tag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gtagId}');
        `}
      </Script>
    </>
  )
}
