import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Providers from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "SiteSeen",
  description: "Your personal archive of websites — curated, framed, discovered.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("scroll-smooth antialiased", inter.variable)}
      suppressHydrationWarning
    >
      <body className="bg-canvas text-ink font-sans transition-colors duration-300">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
