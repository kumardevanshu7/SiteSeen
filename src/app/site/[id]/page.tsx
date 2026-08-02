"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSiteById, deleteSite, SavedSite } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { useOnePassword } from "@/lib/one-password-context";
import RequireAuth from "@/components/RequireAuth";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Globe,
  Layers,
  Trash2,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function SitePage() {
  return (
    <RequireAuth>
      <SiteInner />
    </RequireAuth>
  );
}

function SiteInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, getIdToken } = useAuth();
  const { unlockToken, requireEditAccess } = useOnePassword();
  const [site, setSite] = useState<SavedSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const hostname = site
    ? (() => {
        try {
          return new URL(site.url).hostname;
        } catch {
          return site.url;
        }
      })()
    : "";

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const token = await getIdToken();
        const data = await getSiteById(id, token);
        if (cancelled) return;
        if (!data) setNotFound(true);
        else setSite(data);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, user, getIdToken]);

  const handleDelete = async () => {
    if (!site) return;
    const ok = await requireEditAccess();
    if (!ok) return;
    setIsDeleting(true);
    try {
      const token = await getIdToken();
      const unlock =
        unlockToken ||
        (typeof window !== "undefined"
          ? sessionStorage.getItem("siteseen_one_password_unlock")
          : null);
      await deleteSite(site.id, token, unlock);
      toast.success("Pin removed from collection");
      router.push("/collections");
    } catch {
      toast.error("Failed to remove site");
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-soft flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (notFound || !site) {
    return (
      <div className="min-h-screen bg-surface-soft flex flex-col items-center justify-center gap-6 px-4">
        <Layers className="h-12 w-12 text-ash" />
        <div className="text-center">
          <h1 className="type-heading-lg text-ink mb-2">Pin not found</h1>
          <p className="type-body-sm text-mute">
            This site may have been removed from your collection.
          </p>
        </div>
        <Link href="/collections" className="btn-primary">
          <ArrowLeft className="h-4 w-4" />
          Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-soft text-body">
      <header className="sticky top-0 z-40 h-16 bg-canvas border-b border-hairline flex items-center px-4 md:px-6 gap-4">
        <Link
          href="/collections"
          className="inline-flex items-center gap-1.5 type-body-strong text-ink hover:opacity-70"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Explore</span>
        </Link>
        <span className="type-body-sm text-mute truncate">{site.title}</span>
      </header>

      <section className="mx-auto max-w-content px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <div>
            <div className="overflow-hidden rounded-lg bg-surface-card">
              {site.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={site.imageUrl}
                  alt={site.title}
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    (e.currentTarget.style.display = "none");
                  }}
                />
              ) : (
                <div className="aspect-[4/5] flex flex-col items-center justify-center gap-4 bg-surface-card">
                  {site.favicon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={site.favicon}
                      alt=""
                      className="h-16 w-16 rounded-full object-contain"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-canvas flex items-center justify-center type-heading-xl text-ink">
                      {hostname[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                  <p className="text-[12px] text-mute">No screenshot</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {site.category && (
              <span className="pin-overlay-pill">{site.category}</span>
            )}
            <h1 className="type-heading-xl text-ink">{site.title}</h1>
            <p className="type-body-md text-body">
              {site.description || "No description available."}
            </p>

            <div className="flex flex-wrap gap-2">
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Visit site
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <div className="btn-secondary max-w-full truncate">
                <Globe className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{hostname}</span>
              </div>
            </div>

            {site.tags && site.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {site.tags.map((tag) => (
                  <span key={tag} className="filter-chip">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="rounded-md bg-canvas border border-hairline p-5 space-y-4">
              <div>
                <p className="text-[12px] text-mute mb-1">Added</p>
                <p className="type-body-sm text-ink inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-mute" />
                  {new Date(site.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="h-px bg-hairline" />
              <div>
                <p className="text-[12px] text-mute mb-1">Link</p>
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="type-body-sm text-ink-soft break-all hover:underline inline-flex items-start gap-1"
                >
                  {site.url}
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                </a>
              </div>
            </div>

            <div className="rounded-md border border-hairline bg-canvas p-5">
              <p className="text-[12px] font-bold text-destructive mb-3">
                Danger zone
              </p>
              {confirmDelete ? (
                <div className="space-y-3">
                  <p className="type-body-sm text-body">
                    Remove this pin from your collection?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="btn-primary flex-1 bg-destructive hover:bg-primary-pressed"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Yes, remove
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="btn-secondary flex-1"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 type-button-md text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove from collection
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
