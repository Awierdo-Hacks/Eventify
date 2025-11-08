import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/layout";

export const metadata: Metadata = {
  title: "Eventify - Jouw Droomfeest Begint Hier",
  description: "Vind binnen 5 minuten de perfecte dienstverleners voor jouw event",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className="antialiased">
        <Navigation />
        {children}
      </body>
    </html>
  );
}
