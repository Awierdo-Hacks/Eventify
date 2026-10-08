import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nieuw Event",
  robots: { index: false, follow: false },
};

export default function NewEventLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
