import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vind Dienstverleners",
  description: "Doorzoek honderden geverifieerde evenement-dienstverleners in jouw regio. Vergelijk DJ's, fotografen, cateraars, decorateurs en meer op Eventiphy.",
  openGraph: {
    title: "Vind Dienstverleners | Eventiphy",
    description: "Doorzoek honderden geverifieerde evenement-dienstverleners in jouw regio.",
    url: "https://eventiphy.be/browse",
  },
  alternates: {
    canonical: "https://eventiphy.be/browse",
  },
};

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
