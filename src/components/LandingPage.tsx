"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth-context";
import SiteSeenMark from "@/components/SiteSeenMark";
import SiteFooter from "@/components/SiteFooter";
import {
  Loader2,
  LogIn,
  Shield,
  Database,
  LayoutGrid,
  Sun,
  Moon,
} from "lucide-react";

export default function LandingPage() {
  const { signInWithGoogle, loading } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 bg-surface-soft"
        role="status"
        aria-label="Loading"
      >
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span className="absolute inset-0 rounded-2xl bg-secondary animate-pulse" />
          <SiteSeenMark size={40} className="relative z-10 rounded-xl" />
        </div>
        <p className="text-[13px] text-mute">Loading SiteSeen...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-soft text-body">
      <header className="h-16 flex items-center justify-between px-5 md:px-8 bg-canvas border-b border-hairline">
        <span className="inline-flex items-center gap-2 type-body-strong text-[20px] text-primary select-none">
          <SiteSeenMark size={28} className="rounded-md" />
          SiteSeen
        </span>
        <div className="flex items-center gap-2">
          {mounted && (
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-card text-ink"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}
          <button
            type="button"
            onClick={() => signInWithGoogle()}
            disabled={loading}
            className="btn-secondary"
          >
            <LogIn className="h-3.5 w-3.5" />
            Log in
          </button>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-5 py-section text-center">
        <SiteSeenMark size={72} className="rounded-2xl mb-8 shadow-sm" />
        <h1 className="type-display-xl text-ink max-w-[780px] mb-6">
          Create the collection you love
        </h1>
        <p className="type-body-md text-body max-w-[440px] mb-10">
          SiteSeen archives your favorite websites in a photography-first pin
          grid — secured with Google, stored in Firestore.
        </p>

        <button
          type="button"
          onClick={() => signInWithGoogle()}
          disabled={loading}
          className="btn-primary h-12 px-6 text-[16px]"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          Continue with Google
        </button>

        <p className="mt-4 text-[12px] text-mute max-w-xs">
          Sign in required. No guest mode — your collection stays private.
        </p>

        <div className="mt-section grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-content w-full text-left">
          {[
            {
              icon: Shield,
              title: "Google only",
              body: "Every session starts with your Google account. No anonymous browsing.",
            },
            {
              icon: Database,
              title: "Firestore cloud",
              body: "Pins live in Firebase — same archive on every screen you use.",
            },
            {
              icon: LayoutGrid,
              title: "One Password",
              body: "Edits need your security Q&A unlock. Browse freely after you sign in.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-md bg-surface-card p-8 space-y-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas text-ink">
                <item.icon className="h-4 w-4" />
              </div>
              <h3 className="type-heading-md text-ink">{item.title}</h3>
              <p className="type-body-sm text-mute">{item.body}</p>
            </div>
          ))}
        </div>
      </main>

      <SiteFooter compact />
    </div>
  );
}
