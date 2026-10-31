import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Analyse",
  robots: { index: false, follow: false },
};

export default async function AnalyseLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login?redirect=/analyse");
  }

  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
