'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

const MEASUREMENT_ID = 'G-QK6FDXGTSJ';

export default function GoogleAnalytics() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    // Keep development and preview visits out of the production property.
    setEnabled(['trivia.rocks', 'www.trivia.rocks'].includes(window.location.hostname));
  }, []);

  if (!enabled) return null;
  return <>
    <Script id="google-analytics-config" strategy="afterInteractive">{`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${MEASUREMENT_ID}');
    `}</Script>
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`} strategy="afterInteractive" />
  </>;
}
