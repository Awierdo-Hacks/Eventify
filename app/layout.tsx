import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/layout";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  metadataBase: new URL("https://eventiphy.be"),
  title: {
    default: "Eventiphy - Jouw Droomfeest Begint Hier",
    template: "%s | Eventiphy",
  },
  description: "Vind binnen 5 minuten de perfecte dienstverleners voor jouw event. Geverifieerde fotografen, DJ's, cateraars en meer in jouw regio.",
  keywords: ["evenement organiseren", "dienstverleners event", "fotograaf boeken", "DJ huren", "catering evenement", "Antwerpen", "België"],
  authors: [{ name: "Eventiphy" }],
  creator: "Eventiphy",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    type: "website",
    locale: "nl_BE",
    url: "https://eventiphy.be",
    siteName: "Eventiphy",
    title: "Eventiphy - Jouw Droomfeest Begint Hier",
    description: "Vind binnen 5 minuten de perfecte dienstverleners voor jouw event. Geverifieerde fotografen, DJ's, cateraars en meer in jouw regio.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Eventiphy - Evenement dienstverleners platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Eventiphy - Jouw Droomfeest Begint Hier",
    description: "Vind binnen 5 minuten de perfecte dienstverleners voor jouw event.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
    },
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Eventiphy",
  url: "https://eventiphy.be",
  logo: "https://eventiphy.be/icon.svg",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+32-486-71-47-88",
    contactType: "customer service",
    availableLanguage: "Dutch",
  },
  sameAs: [
    "https://www.instagram.com/eventiphy.be",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Eventiphy",
  url: "https://eventiphy.be",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://eventiphy.be/browse?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="antialiased">
        <SessionProvider>
          <Navigation />
          {children}
        </SessionProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
