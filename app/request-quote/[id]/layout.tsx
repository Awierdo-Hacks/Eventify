import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offerte Aanvragen",
  robots: { index: false, follow: false },
};

export default function RequestQuoteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
