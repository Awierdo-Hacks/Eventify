import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import { fontSans, fontSerif } from '@/app/fonts';
import { Toaster } from '@/components/ui/toaster';
import { site } from '@/config/site';
import { Analytics } from '@/features/consent/analytics';
import { CONSENT_COOKIE, parseConsent } from '@/features/consent/config';
import { ConsentProvider } from '@/features/consent/consent-provider';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name }],
  creator: site.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: site.locale,
    url: site.url,
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#9333ea',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const consent = parseConsent(cookieStore.get(CONSENT_COOKIE)?.value);

  return (
    <html lang={site.language} className={`${fontSans.variable} ${fontSerif.variable}`}>
      <body className="min-h-dvh">
        <a
          href="#inhoud"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-ink-950 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Naar de inhoud
        </a>
        <ConsentProvider initial={consent}>
          {children}
          <Analytics />
        </ConsentProvider>
        <Toaster />
      </body>
    </html>
  );
}
