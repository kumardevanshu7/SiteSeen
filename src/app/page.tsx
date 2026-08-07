"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSites, addSite, deleteSite, SavedSite } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { useOnePassword } from "@/lib/one-password-context";
import SubNav from "@/components/SubNav";
import LandingPage from "@/components/LandingPage";
import AddSiteDialog from "@/components/AddSiteDialog";
import SiteCard from "@/components/SiteCard";
import { PinGridSkeleton } from "@/components/SiteCardSkeleton";
import SiteFooter from "@/components/SiteFooter";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  const { user, loading: authLoading, getIdToken } = useAuth();
  const { unlockToken, requireEditAccess } = useOnePassword();
  const [sites, setSites] = useState<SavedSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

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

  if (authLoading || !user) {
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
      toast.success("Pinned to Firestore", { description: saved.title });
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

  const handleDeleteSite = async (id: string) => {
    const ok = await requireEditAccess();
    if (!ok) throw new Error("Edit access required");
    const token = await getIdToken();
    const unlock =
      unlockToken ||
      (typeof window !== "undefined"
        ? sessionStorage.getItem("siteseen_one_password_unlock")
        : null);
    await deleteSite(id, token, unlock);
    setSites((prev) => prev.filter((site) => site.id !== id));
  };

  const previewSites = sites.slice(0, 8);

  return (
    <div className="min-h-screen flex flex-col bg-surface-soft text-body">
      <SubNav onAddSiteClick={openAdd} />

      <main className="flex-grow">
        <section className="bg-canvas border-b border-hairline">
          <div className="mx-auto max-w-content px-4 md:px-6 py-section">
            <h1 className="type-display-lg text-ink max-w-[640px] mb-4">
              Welcome back
            </h1>
            <p className="type-body-md text-body max-w-[480px] mb-8">
              {sites.length} pin{sites.length === 1 ? "" : "s"} in your archive.
              Browse, filter, or add something new.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={openAdd} className="btn-primary">
                Add website
              </button>
              <Link href="/collections" className="btn-secondary">
                Explore collection
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-content px-4 md:px-6 py-section">
          <div className="flex items-end justify-between mb-6 gap-4">
            <h2 className="type-heading-xl text-ink">Recent pins</h2>
            <Link
              href="/collections"
              className="type-body-strong text-ink-soft hover:underline inline-flex items-center gap-1"
            >
              See all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <PinGridSkeleton count={8} />
          ) : previewSites.length > 0 ? (
            <div className="pin-masonry">
              {previewSites.map((site) => (
                <SiteCard
                  key={site.id}
                  site={site}
                  onDelete={handleDeleteSite}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-surface-card p-10 text-center max-w-md">
              <p className="type-body-md text-mute mb-4">
                Nothing archived yet. Add your first site to Firestore.
              </p>
              <button onClick={openAdd} className="btn-primary">
                Add your first site
              </button>
            </div>
          )}
        </section>

        <section className="bg-surface-dark text-on-dark py-12 px-6">
          <div className="mx-auto max-w-content flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <h2 className="type-heading-xl text-on-dark max-w-md">
              Keep pinning ideas that inspire you.
            </h2>
            <button onClick={openAdd} className="btn-primary shrink-0">
              Add site
            </button>
          </div>
        </section>
      </main>

      <SiteFooter />

      <AddSiteDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSave={handleSaveSite}
      />
    </div>
  );
}
