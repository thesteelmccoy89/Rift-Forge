import type { Metadata, Viewport } from "next";
import { Cinzel, Figtree, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Cinzel({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-display" });
const sans = Figtree({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Rift Forge",
  description: "Deck builder for the Riftbound trading card game",
  appleWebApp: { capable: true, title: "Rift Forge" },
};
export const viewport: Viewport = { themeColor: "#2f5bd8", viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
