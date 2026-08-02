import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/lib/auth-context";
import { OnePasswordProvider } from "@/lib/one-password-context";
import OnePasswordGate from "@/components/OnePasswordGate";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "SiteSeen — Curation framed by invisible UI",
  description: "Add, organize, and browse your favorite websites in a photography-first presentation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("scroll-smooth antialiased", inter.variable)} suppressHydrationWarning>
      <body className="bg-canvas text-ink font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <AuthProvider>
            <OnePasswordProvider>
              {children}
              <OnePasswordGate />
              <Toaster position="bottom-right" />
            </OnePasswordProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

