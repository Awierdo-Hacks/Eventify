import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wachtlijst",
  description: "Schrijf je in op de wachtlijst van Eventiphy en wees als eerste op de hoogte wanneer we lanceren. Gratis voor klanten én dienstverleners.",
  openGraph: {
    title: "Wachtlijst | Eventiphy",
    description: "Schrijf je in op de wachtlijst en wees als eerste op de hoogte wanneer Eventiphy lanceert.",
    url: "https://eventiphy.be/waitlist",
  },
  alternates: {
    canonical: "https://eventiphy.be/waitlist",
  },
};

export default function WaitlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
