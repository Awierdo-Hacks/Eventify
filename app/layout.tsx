import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/layout";
import { SessionProvider } from "@/components/providers/SessionProvider";

export const metadata: Metadata = {
  title: "Eventiphy - Jouw Droomfeest Begint Hier",
  description: "Vind binnen 5 minuten de perfecte dienstverleners voor jouw event",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className="antialiased">
        <SessionProvider>
          <Navigation />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
