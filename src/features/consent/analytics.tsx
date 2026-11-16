'use client';

import Script from 'next/script';
import { useConsent } from '@/features/consent/consent-provider';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Optional analytics. Nothing is requested from a third party unless (1) a
 * measurement id is configured and (2) the visitor allowed "Statistieken".
 * Withdrawing consent stops loading it on the next page view.
 *
 * To add another tool, render it here behind the matching consent flag.
 */
export function Analytics() {
  const { consent } = useConsent();
  if (!GA_ID || !consent?.analytics) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', { ad_storage: '${consent.marketing ? 'granted' : 'denied'}', ad_user_data: '${consent.marketing ? 'granted' : 'denied'}', ad_personalization: '${consent.marketing ? 'granted' : 'denied'}', analytics_storage: 'granted' });
gtag('js', new Date());
gtag('config', '${GA_ID}', { anonymize_ip: true });`}
      </Script>
    </>
  );
}
