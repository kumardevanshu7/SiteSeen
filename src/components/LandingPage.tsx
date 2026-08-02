"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth-context";
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

  return (
    <div className="min-h-screen flex flex-col bg-surface-soft text-body">
      <header className="h-16 flex items-center justify-between px-5 md:px-8 bg-canvas border-b border-hairline">
        <span className="type-body-strong text-[20px] text-primary select-none">
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

      <footer className="py-8 text-center text-[12px] text-mute border-t border-hairline bg-canvas">
        © 2026 SiteSeen · Arigato Labs
      </footer>
    </div>
  );
}
