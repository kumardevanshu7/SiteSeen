"use client";

import { useAuth } from "@/lib/auth-context";
import { Loader2, LogIn, Shield, Database, LayoutGrid } from "lucide-react";

export default function LandingPage() {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink relative overflow-hidden">
      {/* Atmosphere */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,102,204,0.12), transparent 55%), radial-gradient(ellipse 60% 40% at 90% 80%, rgba(0,0,0,0.04), transparent 50%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <header className="relative z-10 h-[52px] flex items-center justify-between px-5 md:px-8">
        <span className="text-[20px] font-semibold tracking-apple-tight select-none">
          SiteSeen
        </span>
        <button
          type="button"
          onClick={() => signInWithGoogle()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-pill border border-hairline bg-canvas/80 backdrop-blur-sm hover:bg-surface-pearl transition-all"
        >
          <LogIn className="h-3.5 w-3.5" />
          Sign in
        </button>
      </header>

      <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-5 pb-16 pt-8 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary mb-5">
          Private curation
        </p>

        <h1 className="text-[2.6rem] sm:text-5xl md:text-6xl font-bold tracking-apple-display leading-[1.05] max-w-[720px] mb-5">
          SiteSeen
        </h1>

        <p className="text-base sm:text-lg text-ink-muted-80 font-light tracking-apple-tight max-w-[440px] leading-relaxed mb-10">
          Your personal archive of websites — secured with Google, stored in
          Firestore, unlocked only by you.
        </p>

        <button
          type="button"
          onClick={() => signInWithGoogle()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-7 py-3 bg-primary hover:bg-primary-focus active:scale-[0.98] text-white text-[15px] rounded-pill shadow-sm transition-all disabled:opacity-70"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          Continue with Google
        </button>

        <p className="mt-4 text-[11px] text-ink/45 max-w-xs">
          Sign in required. No guest mode — your collection stays private.
        </p>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10 max-w-[720px] w-full text-left">
          {[
            {
              icon: Shield,
              title: "Google only",
              body: "No anonymous browsing. Every session starts with your Google account.",
            },
            {
              icon: Database,
              title: "Firestore cloud",
              body: "Sites live in Firebase — not on this device. Same archive on every screen.",
            },
            {
              icon: LayoutGrid,
              title: "One Password",
              body: "Edits need your security Q&A unlock. Browse freely after you sign in.",
            },
          ].map((item) => (
            <div key={item.title} className="space-y-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <item.icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold tracking-apple-tight">
                {item.title}
              </h3>
              <p className="text-xs text-ink/55 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 py-6 text-center text-[11px] text-ink/40">
        © 2026 SiteSeen · Arigato Labs
      </footer>
    </div>
  );
}
