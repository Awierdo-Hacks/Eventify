import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analyse",
  robots: { index: false, follow: false },
};

export default function AnalyseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
