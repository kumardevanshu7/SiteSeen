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
  Tag,
  Globe,
  Layers,
  Trash2,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
      toast.success("Site removed from collection");
      router.push("/collections");
    } catch {
      toast.error("Failed to remove site");
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-canvas dark:bg-surface-tile-2 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-ink/40 dark:text-white/30">
          <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-sm font-sans tracking-apple-tight">Loading site details...</p>
        </div>
      </div>
    );
  }

  // ─── Not found ────────────────────────────────────────────────────────────
  if (notFound || !site) {
    return (
      <div className="min-h-screen bg-canvas dark:bg-surface-tile-2 flex flex-col items-center justify-center gap-6 px-4">
        <Layers className="h-12 w-12 text-ink/20 dark:text-white/20" />
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-apple-tight text-ink dark:text-white mb-2">
            Site not found
          </h1>
          <p className="text-sm text-ink/50 dark:text-white/40">
            This site may have been removed from your collection.
          </p>
        </div>
        <Link
          href="/collections"
          className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-focus text-white text-sm font-medium rounded-pill transition-all active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Collection
        </Link>
      </div>
    );
  }

  // ─── Detail Page ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-canvas dark:bg-surface-tile-2 text-ink dark:text-white">

      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-40 h-[52px] bg-canvas/80 dark:bg-surface-tile-2/80 backdrop-blur-md border-b border-border/60 flex items-center px-4 md:px-6 gap-4">
        <Link
          href="/collections"
          className="flex items-center gap-1.5 text-ink/70 dark:text-white/70 hover:text-ink dark:hover:text-white text-xs font-normal tracking-apple-tight transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Collections</span>
        </Link>
        <div className="h-4 w-px bg-border/80 hidden sm:block" />
        <span className="text-xs font-semibold tracking-apple-tight text-ink/60 dark:text-white/60 truncate">
          {site.title}
        </span>
      </header>

      {/* ── Hero Image Section ── */}
      <section className="relative w-full bg-surface-tile-1 overflow-hidden" style={{ minHeight: "340px" }}>
        {site.imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={site.imageUrl}
              alt={site.title}
              className="w-full h-full object-cover absolute inset-0"
              style={{ minHeight: "340px" }}
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            {/* Gradient overlay at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-tile-1 via-surface-tile-1/30 to-transparent" />
          </>
        ) : (
          /* No image — beautiful branded placeholder */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-surface-tile-1 to-surface-tile-2">
            <div className="relative">
              {site.favicon ? (
                <>
                  {/* Glow ring */}
                  <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-2xl scale-150" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={site.favicon}
                    alt=""
                    className="relative h-20 w-20 rounded-2xl object-contain border border-white/10 bg-white/5 p-2"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </>
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-3xl">
                  {hostname[0]?.toUpperCase() ?? "?"}
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-white/30 text-xs font-mono tracking-widest uppercase">
                No screenshot available
              </p>
            </div>
          </div>
        )}

        {/* Bottom content overlay — category + title */}
        <div className="relative z-10 mx-auto max-w-[860px] px-4 md:px-6 pb-8 pt-[200px]">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-primary-on-dark mb-2 block">
            {site.category}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-apple-display text-white leading-tight">
            {site.title}
          </h1>
        </div>
      </section>

      {/* ── Main Content ── */}
      <section className="bg-canvas dark:bg-surface-tile-2 py-10">
        <div className="mx-auto max-w-[860px] px-4 md:px-6">

          {/* CTA row */}
          <div className="flex flex-wrap items-center gap-4 mb-10 pb-8 border-b border-hairline dark:border-white/8">
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-focus active:scale-95 text-white text-sm font-semibold rounded-pill shadow-sm transition-all"
            >
              Visit Site
              <ArrowUpRight className="h-4 w-4" />
            </a>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-canvas-parchment dark:bg-surface-tile-3 border border-hairline dark:border-white/8 rounded-pill text-xs font-mono text-ink/60 dark:text-white/50 truncate max-w-xs">
              <Globe className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{hostname}</span>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-10">

            {/* ── Left: Description + Tags ── */}
            <div className="space-y-8">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-ink/40 dark:text-white/30 mb-3">
                  About
                </h2>
                <p className="text-base text-ink-muted-80 dark:text-body-muted leading-relaxed">
                  {site.description || "No description available for this site."}
                </p>
              </div>

              {/* Tags */}
              {site.tags && site.tags.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-3.5 w-3.5 text-ink/30 dark:text-white/30" />
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-ink/40 dark:text-white/30">
                      Tags
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {site.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-canvas-parchment dark:bg-surface-tile-3 text-ink/70 dark:text-white/60 border border-hairline/60 dark:border-white/8 rounded-pill px-3 py-1.5 text-sm font-normal"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Full URL card */}
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-ink/40 dark:text-white/30 mb-3">
                  Link
                </h2>
                <div className="flex items-center gap-3 p-4 bg-canvas-parchment dark:bg-surface-tile-3 rounded-lg border border-hairline dark:border-white/8">
                  {/* Favicon in URL card */}
                  {site.favicon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={site.favicon}
                      alt=""
                      className="h-5 w-5 object-contain rounded-sm flex-shrink-0"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  )}
                  <span className="text-sm font-mono text-ink/70 dark:text-white/50 truncate flex-1">
                    {site.url}
                  </span>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 p-1.5 rounded-sm hover:bg-hairline dark:hover:bg-white/10 text-primary dark:text-primary-on-dark transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* ── Right: Metadata sidebar ── */}
            <div className="space-y-6">

              {/* Favicon card */}
              {site.favicon && (
                <div className="p-5 bg-canvas-parchment dark:bg-surface-tile-3 rounded-lg border border-hairline dark:border-white/8 flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={site.favicon}
                    alt=""
                    className="h-12 w-12 rounded-xl object-contain bg-white dark:bg-surface-tile-2 p-1.5 border border-hairline dark:border-white/8 shadow-sm"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink dark:text-white truncate">{site.title}</p>
                    <p className="text-xs text-ink/50 dark:text-white/40 font-mono truncate">{hostname}</p>
                  </div>
                </div>
              )}

              {/* Metadata list */}
              <div className="p-5 bg-canvas-parchment dark:bg-surface-tile-3 rounded-lg border border-hairline dark:border-white/8 space-y-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/35 dark:text-white/25 mb-1">Category</p>
                  <p className="text-sm font-semibold text-primary dark:text-primary-on-dark uppercase tracking-wider text-[11px]">
                    {site.category}
                  </p>
                </div>
                <div className="h-px bg-hairline dark:bg-white/5" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/35 dark:text-white/25 mb-1">Added</p>
                  <p className="text-sm text-ink/70 dark:text-white/60 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 opacity-50" />
                    {new Date(site.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="h-px bg-hairline dark:bg-white/5" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/35 dark:text-white/25 mb-1">Domain</p>
                  <p className="text-sm text-ink/70 dark:text-white/60 font-mono">{hostname}</p>
                </div>
              </div>

              {/* Danger zone */}
              <div className="p-4 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-red-400 mb-3">
                  Danger Zone
                </p>
                {confirmDelete ? (
                  <div className="space-y-2">
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Remove this site from your collection?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-sm active:scale-95 transition-all"
                      >
                        <Check className="h-3 w-3" />
                        Yes, remove
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white dark:bg-surface-tile-3 border border-hairline dark:border-white/10 text-ink dark:text-white text-xs rounded-sm active:scale-95 transition-all"
                      >
                        <X className="h-3 w-3" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove from collection
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
