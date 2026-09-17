"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSiteById, getSites, getCategories, deleteSite, updateSite, recordSiteVisit, SavedSite } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { useOnePassword } from "@/lib/one-password-context";
import RequireAuth from "@/components/RequireAuth";
import SiteCard from "@/components/SiteCard";
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
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { BrandLoader } from "@/components/SiteSeenMark";
import { HuggingFaceIcon, isHuggingFace } from "@/components/HuggingFace";

const cacheKey = (id: string) => `siteseen_site_${id}`;

export default function SitePage() {
  return (
    <RequireAuth>
      <SiteInner />
    </RequireAuth>
  );
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function readCachedSite(id: string): SavedSite | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(cacheKey(id));
    if (!raw) return null;
    return JSON.parse(raw) as SavedSite;
  } catch {
    return null;
  }
}

function SiteInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, getIdToken } = useAuth();
  const { unlockToken, requireEditAccess } = useOnePassword();
  const [site, setSite] = useState<SavedSite | null>(() => readCachedSite(id));
  const [allSites, setAllSites] = useState<SavedSite[]>([]);
  const [loading, setLoading] = useState(!site);
  const [notFound, setNotFound] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Category editing
  const [editingCategory, setEditingCategory] = useState(false);
  const [draftCategory, setDraftCategory] = useState("");
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [savingCategory, setSavingCategory] = useState(false);

  const hostname = site ? getHostname(site.url) : "";
  const isHF = isHuggingFace(site);

  useEffect(() => {
    const cached = readCachedSite(id);
    if (cached) {
      setSite(cached);
      setLoading(false);
      setNotFound(false);
    }
  }, [id]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      if (!site) setLoading(true);
      try {
        const token = await getIdToken();
        const [data, list, cats] = await Promise.all([
          getSiteById(id, token),
          getSites(token),
          getCategories(token).catch(() => [] as string[]),
        ]);
        if (cancelled) return;
        if (!data) {
          if (!site) setNotFound(true);
        } else {
          setSite(data);
          setNotFound(false);
          // Record visit in background
          recordSiteVisit(id, token).catch(() => {});
          try {
            sessionStorage.setItem(cacheKey(id), JSON.stringify(data));
          } catch {
            // ignore
          }
        }
        setAllSites(list);
        setAllCategories(cats);
      } catch {
        if (!cancelled && !site) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user, getIdToken]);

  const suggestions = useMemo(() => {
    if (!site) return [] as SavedSite[];
    const tags = (site.tags || []).map((t) => t.toLowerCase());
    const category = (site.category || "").toLowerCase();

    return allSites
      .filter((s) => s.id !== site.id)
      .map((s) => {
        let score = 0;
        const sTags = (s.tags || []).map((t) => t.toLowerCase());
        for (const tag of tags) {
          if (sTags.includes(tag)) score += 3;
        }
        if (category && s.category?.toLowerCase() === category) score += 2;
        return { site: s, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || b.site.createdAt - a.site.createdAt)
      .slice(0, 6)
      .map((x) => x.site);
  }, [site, allSites]);

  const goBack = () => {
    try {
      sessionStorage.setItem("siteseen_slide_back", "1");
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event("siteseen-page-exit"));
    window.setTimeout(() => {
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
      } else {
        router.push("/collections");
      }
    }, 200);
  };

  const handleDelete = async () => {
    if (!site) return;
    const ok = await requireEditAccess({ force: true });
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
      try {
        sessionStorage.removeItem(cacheKey(site.id));
      } catch {
        // ignore
      }
      toast.success("Pin removed from collection");
      router.push("/collections");
    } catch {
      toast.error("Failed to remove site");
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleDeleteSuggestion = async (sid: string) => {
    const ok = await requireEditAccess({ force: true });
    if (!ok) throw new Error("Edit access required");
    const token = await getIdToken();
    const unlock =
      unlockToken ||
      (typeof window !== "undefined"
        ? sessionStorage.getItem("siteseen_one_password_unlock")
        : null);
    await deleteSite(sid, token, unlock);
    setAllSites((prev) => prev.filter((s) => s.id !== sid));
  };

  const startEditCategory = async () => {
    const ok = await requireEditAccess({ force: true });
    if (!ok) return;
    setDraftCategory(site?.category || "");
    setEditingCategory(true);
  };

  const cancelEditCategory = () => {
    setEditingCategory(false);
    setDraftCategory("");
  };

  const saveCategory = async () => {
    if (!site || !draftCategory.trim()) return;
    setSavingCategory(true);
    try {
      const token = await getIdToken();
      const unlock =
        unlockToken ||
        (typeof window !== "undefined"
          ? sessionStorage.getItem("siteseen_one_password_unlock")
          : null);
      await updateSite(site.id, { category: draftCategory.trim() }, token, unlock);
      const updated = { ...site, category: draftCategory.trim() };
      setSite(updated);
      try { sessionStorage.setItem(cacheKey(site.id), JSON.stringify(updated)); } catch { /* ignore */ }
      toast.success("Category updated");
      setEditingCategory(false);
    } catch {
      toast.error("Failed to update category.");
    } finally {
      setSavingCategory(false);
    }
  };

  if (loading && !site) {
    return <BrandLoader label="Loading pin..." />;
  }

  if ((notFound || !site) && !loading) {
    return (
      <div className="min-h-[100dvh] bg-surface-soft flex flex-col items-center justify-center gap-6 px-4">
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

  if (!site) return null;

  const markSrc = site.favicon || site.imageUrl;

  return (
    <div className="min-h-[100dvh] bg-surface-soft text-body flex flex-col">
      <header className="sticky top-0 z-40 h-14 md:h-16 bg-canvas/95 backdrop-blur border-b border-hairline flex items-center px-3 md:px-6 gap-3">
        <button
          type="button"
          onClick={goBack}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-card text-ink shrink-0"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="type-body-sm font-semibold text-ink truncate">
          {site.title}
        </span>
      </header>

      <div className="flex-1 pb-[88px] md:pb-10">
        <main className="mx-auto w-full max-w-xl px-4 pt-5 md:pt-8 space-y-6">
          <article
            className={`rounded-2xl border p-5 md:p-7 space-y-4 shadow-sm transition-colors ${
              isHF
                ? "border-amber-200/90 bg-[#FFFDF5] dark:border-amber-800/50 dark:bg-[#231E12]"
                : "border-hairline bg-canvas"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border overflow-hidden ${
                  isHF
                    ? "border-amber-200/90 bg-[#FFF9DB] dark:border-amber-800/50 dark:bg-[#282110]"
                    : "border-hairline bg-secondary"
                }`}
              >
                {markSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={markSrc}
                    alt=""
                    className="h-7 w-7 object-contain"
                    onError={(e) => {
                      const el = e.currentTarget;
                      if (site.favicon && el.src !== site.favicon) {
                        el.src = site.favicon;
                        return;
                      }
                      el.style.display = "none";
                    }}
                  />
                ) : isHF ? (
                  <HuggingFaceIcon className="h-7 w-7" />
                ) : (
                  <span className="type-heading-md text-ink">
                    {hostname[0]?.toUpperCase() ?? "?"}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                {editingCategory ? (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-mute uppercase tracking-wide">Change Category</p>
                    <div className="flex flex-wrap gap-1.5">
                      {/* Existing categories as chips */}
                      {Array.from(new Set([
                        ...allCategories,
                        ...(site.category ? [site.category] : []),
                        "Uncategorized",
                      ])).sort().map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setDraftCategory(cat)}
                          className={`filter-chip text-[12px] py-1 px-2.5 ${
                            draftCategory === cat ? "filter-chip-active" : ""
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    {/* Free-text input for new category */}
                    <input
                      type="text"
                      value={draftCategory}
                      onChange={(e) => setDraftCategory(e.target.value)}
                      placeholder="Or type a new category..."
                      className="h-9 w-full rounded-md border border-hairline bg-surface-soft px-3 text-sm text-ink"
                    />
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={cancelEditCategory}
                        disabled={savingCategory}
                        className="btn-secondary h-8 text-xs flex-1"
                      >
                        <X className="h-3 w-3" /> Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveCategory}
                        disabled={savingCategory || !draftCategory.trim()}
                        className="btn-primary h-8 text-xs flex-1"
                      >
                        <Check className="h-3 w-3" />
                        {savingCategory ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[12px] font-bold text-mute inline-flex items-center gap-1.5">
                        {isHF && <HuggingFaceIcon className="h-3.5 w-3.5 shrink-0" />}
                        <span>{site.category || (isHF ? "Hugging Face" : "Uncategorized")}</span>
                      </span>
                      <button
                        type="button"
                        onClick={startEditCategory}
                        title="Change category"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-soft bg-surface-card hover:bg-hairline px-2.5 py-0.5 rounded-full border border-hairline transition-colors cursor-pointer shadow-xs"
                      >
                        <Pencil className="h-2.5 w-2.5 text-mute" />
                        <span>Edit</span>
                      </button>
                    </div>
                    <h1 className="type-heading-lg text-ink leading-tight">
                      {site.title}
                    </h1>
                  </>
                )}
              </div>
            </div>

            <p className="type-body-sm text-mute inline-flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              {hostname}
            </p>

            <p className="type-body-md text-body">
              {site.description || "No description available."}
            </p>

            {site.tags && site.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {site.tags.map((tag) => (
                  <span key={tag} className="filter-chip">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="rounded-xl bg-surface-soft border border-hairline p-3.5 space-y-2">
              <p className="type-body-sm text-ink inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-mute" />
                Added{" "}
                {new Date(site.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
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

            <div className="pt-1">
              {confirmDelete ? (
                <div className="flex flex-wrap items-center gap-2">
                  <p className="type-body-sm text-body w-full mb-1">
                    Remove this pin?
                  </p>
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
          </article>

          <section>
            <h2 className="type-heading-md text-ink mb-1">Suggestions</h2>
            <p className="type-body-sm text-mute mb-3">
              More pins matching this category or tags.
            </p>

            {suggestions.length > 0 ? (
              <div className="suggest-rail">
                {suggestions.map((s) => (
                  <SiteCard
                    key={s.id}
                    site={s}
                    onDelete={handleDeleteSuggestion}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-hairline bg-canvas px-5 py-8 text-center">
                <p className="type-body-sm text-mute">
                  No related pins yet. Add more sites with similar tags.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Phone sticky bottom CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-canvas/95 backdrop-blur px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <a
          href={site.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary w-full h-12 text-[15px]"
        >
          Visit site
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>

      <div className="hidden md:block mx-auto w-full max-w-xl px-4 pb-8">
        <a
          href={site.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          Visit site
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
