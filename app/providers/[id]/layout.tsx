import type { Metadata } from "next";

// Per-provider dynamic metadata could be added here via generateMetadata()
// once the page is refactored to server-side data fetching.
// For now, a meaningful static fallback ensures all provider pages are indexable.
export const metadata: Metadata = {
  title: "Dienstverlener Profiel",
  description: "Bekijk het profiel, portfolio, beschikbaarheid en reviews van deze evenement-dienstverlener op Eventiphy.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
