"use client";

import Link from "next/link";
import SubNav from "@/components/SubNav";
import SiteSeenMark from "@/components/SiteSeenMark";
import SiteFooter from "@/components/SiteFooter";
import { useAuth } from "@/lib/auth-context";

export default function LegalShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  const { user, loading } = useAuth();
  const showNav = !loading && !!user;

  return (
    <div className="min-h-screen flex flex-col bg-surface-soft text-body">
      {showNav ? (
        <SubNav showAdd={false} />
      ) : (
        <header className="h-16 border-b border-hairline bg-canvas flex items-center px-4 md:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 type-body-strong text-[20px] text-primary"
          >
            <SiteSeenMark size={28} className="rounded-md" />
            SiteSeen
          </Link>
        </header>
      )}

      <main className="flex-1 mx-auto w-full max-w-content px-4 md:px-6 py-section">
        <header className="max-w-[720px] mx-auto mb-10">
          <h1 className="type-heading-xl text-ink mb-2">{title}</h1>
          {subtitle ? (
            <p className="type-body-sm text-mute">{subtitle}</p>
          ) : null}
        </header>
        <div className="max-w-[720px] mx-auto space-y-6 type-body-sm text-body leading-relaxed">
          {children}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
