"use client";

import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/lib/auth-context";
import { OnePasswordProvider } from "@/lib/one-password-context";
import OnePasswordGate from "@/components/OnePasswordGate";
import { Toaster } from "@/components/ui/sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange={false}
      storageKey="siteseen-theme"
    >
      <AuthProvider>
        <OnePasswordProvider>
          {children}
          <OnePasswordGate />
          <Toaster position="bottom-right" />
        </OnePasswordProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
