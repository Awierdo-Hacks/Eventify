import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Provider Dashboard",
  robots: { index: false, follow: false },
};

export default function ProviderDashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
