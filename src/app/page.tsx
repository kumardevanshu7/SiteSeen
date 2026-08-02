"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSites, addSite, SavedSite } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { useOnePassword } from "@/lib/one-password-context";
import SubNav from "@/components/SubNav";
import LandingPage from "@/components/LandingPage";
import AddSiteDialog from "@/components/AddSiteDialog";
import SiteCard from "@/components/SiteCard";
import {
  Plus,
  ChevronRight,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  const { user, loading: authLoading, getIdToken } = useAuth();
  const { unlockToken, requireEditAccess } = useOnePassword();
  const [sites, setSites] = useState<SavedSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setSites([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function loadData() {
      setLoading(true);
      try {
        const token = await getIdToken();
        const data = await getSites(token);
        if (!cancelled) setSites(data);
      } catch (err) {
        console.error("Failed to load sites", err);
        toast.error("Could not load your collection from Firestore.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, getIdToken]);

  useEffect(() => {
    if (!user) return;
    const handleScroll = () => setShowStickyBar(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  const handleSaveSite = async (
    newSiteData: Omit<SavedSite, "id" | "createdAt">
  ) => {
    try {
      const ok = await requireEditAccess();
      if (!ok) throw new Error("Edit access required");
      const token = await getIdToken();
      const unlock =
        unlockToken ||
        (typeof window !== "undefined"
          ? sessionStorage.getItem("siteseen_one_password_unlock")
          : null);
      const saved = await addSite(newSiteData, token, unlock);
      setSites([saved, ...sites]);
      toast.success("Website saved to Firestore", {
        description: saved.title,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to save website.");
      throw err;
    }
  };

  const openAdd = async () => {
    const ok = await requireEditAccess();
    if (ok) setIsAddDialogOpen(true);
  };

  const previewSites = sites.slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col relative bg-canvas text-ink transition-colors">
      <SubNav onAddSiteClick={openAdd} />

      <main className="flex-grow">
        <section className="relative overflow-hidden bg-canvas py-16 md:py-24 border-b border-border/40">
          <div className="mx-auto max-w-[980px] px-4 md:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary mb-3">
              Welcome back
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-apple-display text-ink dark:text-white leading-tight mb-3 max-w-[640px]">
              Your archive is ready.
            </h1>
            <p className="text-base sm:text-lg text-ink-muted-80 dark:text-body-muted max-w-[520px] mb-8">
              {sites.length} site{sites.length === 1 ? "" : "s"} in Firestore.
              Browse, filter, or add something new.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={openAdd}
                className="px-5 py-2.5 bg-primary hover:bg-primary-focus text-white text-[14px] rounded-pill transition-all"
              >
                Add Website
              </button>
              <Link
                href="/collections"
                className="px-5 py-2.5 border border-hairline dark:border-white/15 text-ink dark:text-white text-[14px] rounded-pill flex items-center gap-1 hover:bg-canvas-parchment dark:hover:bg-white/5 transition-all"
              >
                Open Collection <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-canvas-parchment dark:bg-surface-tile-3 py-14 border-b border-border/40">
          <div className="mx-auto max-w-[980px] px-4 md:px-6">
            <div className="flex items-end justify-between mb-8 gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-2 block">
                  Recent
                </span>
                <h2 className="text-2xl font-semibold tracking-apple-headline text-ink dark:text-white">
                  From your collection
                </h2>
              </div>
              <Link
                href="/collections"
                className="text-sm text-primary dark:text-primary-on-dark hover:underline flex items-center gap-1 shrink-0"
              >
                See all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-16 text-ink/50">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : previewSites.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {previewSites.map((site) => (
                  <SiteCard
                    key={site.id}
                    site={site}
                    onDelete={async () => {
                      toast.message("Delete from Collections");
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-14 px-4">
                <p className="text-sm text-ink-muted-80 dark:text-body-muted mb-4">
                  Nothing archived yet. Add your first site to Firestore.
                </p>
                <button
                  onClick={openAdd}
                  className="px-4 py-2 bg-primary text-white text-xs rounded-pill"
                >
                  Add Your First Site
                </button>
              </div>
            )}
          </div>
        </section>

        <section
          id="about-philosophy"
          className="bg-surface-tile-2 py-16 text-white"
        >
          <div className="mx-auto max-w-[640px] px-6 text-center">
            <h2 className="text-xl sm:text-2xl font-bold tracking-apple-headline mb-4">
              Framed by near-invisible UI.
            </h2>
            <p className="text-sm text-body-muted leading-relaxed">
              Your bookmarks stay in the cloud. Edits stay behind One Password.
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-canvas-parchment dark:bg-surface-tile-3 py-10 border-t border-border/20">
        <div className="mx-auto max-w-[980px] px-4 md:px-6 text-[11px] text-ink-muted-48 dark:text-body-muted flex flex-col sm:flex-row sm:justify-between gap-2">
          <p>Copyright © 2026 SiteSeen. All rights reserved.</p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline flex items-center gap-0.5"
          >
            GitHub <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </footer>

      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md h-16 bg-white/80 dark:bg-surface-tile-2/85 backdrop-blur-md border border-hairline dark:border-white/10 rounded-pill shadow-xl px-6 py-2 flex items-center justify-between transition-all duration-300 ${
          showStickyBar
            ? "translate-y-0 opacity-100"
            : "translate-y-24 opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-ink dark:text-white">
            SiteSeen
          </span>
          <span className="text-[10px] text-ink-muted-80 dark:text-body-muted">
            {sites.length} in Firestore
          </span>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs rounded-pill"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Site
        </button>
      </div>

      <AddSiteDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSave={handleSaveSite}
      />
    </div>
  );
}
