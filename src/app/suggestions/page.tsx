"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  getSites,
  addSite,
  deleteSite,
  recordSiteVisit,
  SavedSite,
} from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { useOnePassword } from "@/lib/one-password-context";
import SubNav from "@/components/SubNav";
import RequireAuth from "@/components/RequireAuth";
import AddSiteDialog from "@/components/AddSiteDialog";
import { PinGridSkeleton } from "@/components/SiteCardSkeleton";
import SiteFooter from "@/components/SiteFooter";
import {
  Sparkles,
  Clock,
  ArrowUpRight,
  Trash2,
  Check,
  X,
  Copy,
  Shuffle,
} from "lucide-react";
import { toast } from "sonner";
import { HuggingFaceIcon, isHuggingFace } from "@/components/HuggingFace";

type InactivityThreshold = 7 | 10 | 15 | 17 | 30 | "never";

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function SuggestionsPage() {
  return (
    <RequireAuth>
      <SuggestionsInner />
    </RequireAuth>
  );
}

function SuggestionsInner() {
  const { user, getIdToken } = useAuth();
  const { unlockToken, requireEditAccess } = useOnePassword();

  const [sites, setSites] = useState<SavedSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [threshold, setThreshold] = useState<InactivityThreshold>(7);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      try {
        const token = await getIdToken();
        const data = await getSites(token);
        if (!cancelled) {
          setSites(data);
        }
      } catch (err) {
        console.error("Failed to load suggestions", err);
        toast.error("Failed to load pins from Firestore.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [user, getIdToken]);

  // Compute days inactive for each site
  const siteInactivityMap = useMemo(() => {
    const now = Date.now();
    const map = new Map<
      string,
      { daysInactive: number; neverOpened: boolean; lastTimestamp: number }
    >();

    for (const s of sites) {
      const neverOpened = !s.lastOpenedAt;
      const lastTimestamp = s.lastOpenedAt || s.createdAt || now;
      const msElapsed = Math.max(0, now - lastTimestamp);
      const daysInactive = Math.floor(msElapsed / (1000 * 60 * 60 * 24));
      map.set(s.id, { daysInactive, neverOpened, lastTimestamp });
    }

    return map;
  }, [sites]);

  // Counts for each filter threshold
  const thresholdCounts = useMemo(() => {
    let count7 = 0;
    let count10 = 0;
    let count15 = 0;
    let count17 = 0;
    let count30 = 0;
    let countNever = 0;

    siteInactivityMap.forEach((info) => {
      if (info.daysInactive >= 7) count7++;
      if (info.daysInactive >= 10) count10++;
      if (info.daysInactive >= 15) count15++;
      if (info.daysInactive >= 17) count17++;
      if (info.daysInactive >= 30) count30++;
      if (info.neverOpened) countNever++;
    });

    return {
      7: count7,
      10: count10,
      15: count15,
      17: count17,
      30: count30,
      never: countNever,
    };
  }, [siteInactivityMap]);

  // Filtered stale sites
  const staleSites = useMemo(() => {
    return sites
      .filter((s) => {
        const info = siteInactivityMap.get(s.id);
        if (!info) return false;

        // Inactivity threshold check
        let matchesThreshold = false;
        if (threshold === "never") {
          matchesThreshold = info.neverOpened;
        } else {
          matchesThreshold = info.daysInactive >= threshold;
        }

        if (!matchesThreshold) return false;

        // Category check
        if (
          selectedCategory !== "All" &&
          (s.category || "").toLowerCase() !== selectedCategory.toLowerCase()
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const infoA = siteInactivityMap.get(a.id);
        const infoB = siteInactivityMap.get(b.id);
        // Most inactive first
        return (infoB?.daysInactive || 0) - (infoA?.daysInactive || 0);
      });
  }, [sites, siteInactivityMap, threshold, selectedCategory]);

  // Categories available in the filtered list
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    for (const s of sites) {
      const info = siteInactivityMap.get(s.id);
      if (!info) continue;
      const matches =
        threshold === "never"
          ? info.neverOpened
          : info.daysInactive >= threshold;
      if (matches && s.category) set.add(s.category);
    }
    return (["All"] as string[]).concat(Array.from(set).sort());
  }, [sites, siteInactivityMap, threshold]);

  const handleCopyUrl = async (e: React.MouseEvent, site: SavedSite) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(site.url);
      setCopiedId(site.id);
      toast.success("URL copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  const handleVisit = async (site: SavedSite) => {
    try {
      const token = await getIdToken();
      recordSiteVisit(site.id, token).catch(() => {});
      const now = Date.now();
      setSites((prev) =>
        prev.map((s) =>
          s.id === site.id
            ? { ...s, lastOpenedAt: now, visitCount: (s.visitCount || 0) + 1 }
            : s
        )
      );
      toast.success("Marked as visited!", { description: site.title });
    } catch {
      // ignore
    }
  };

  const handleDelete = async (siteId: string) => {
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
      await deleteSite(siteId, token, unlock);
      setSites((prev) => prev.filter((s) => s.id !== siteId));
      setConfirmDeleteId(null);
      toast.success("Pin removed from collection");
    } catch {
      toast.error("Failed to delete pin");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSurpriseMe = () => {
    if (staleSites.length === 0) {
      toast.message("No inactive pins to pick from!");
      return;
    }
    const random = staleSites[Math.floor(Math.random() * staleSites.length)];
    handleVisit(random);
    window.open(random.url, "_blank", "noopener,noreferrer");
  };

  const handleSaveSite = async (
    newSiteData: Omit<SavedSite, "id" | "createdAt">
  ) => {
    const ok = await requireEditAccess();
    if (!ok) throw new Error("Edit access required");
    const token = await getIdToken();
    const unlock =
      unlockToken ||
      (typeof window !== "undefined"
        ? sessionStorage.getItem("siteseen_one_password_unlock")
        : null);
    const saved = await addSite(newSiteData, token, unlock);
    setSites((prev) => [saved, ...prev]);
    toast.success("Pinned to collection", { description: saved.title });
  };

  const thresholdsList: { label: string; value: InactivityThreshold }[] = [
    { label: "7+ Days", value: 7 },
    { label: "10+ Days", value: 10 },
    { label: "15+ Days", value: 15 },
    { label: "17+ Days", value: 17 },
    { label: "30+ Days", value: 30 },
    { label: "Never Opened", value: "never" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface-soft text-body">
      <SubNav
        onAddSiteClick={async () => {
          const ok = await requireEditAccess();
          if (ok) setIsAddDialogOpen(true);
        }}
      />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-canvas border-b border-hairline">
          <div className="mx-auto max-w-content px-4 md:px-6 py-8 md:py-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3">
                  <Sparkles className="h-3.5 w-3.5" />
                  Suggestions &amp; Rediscover
                </div>
                <h1 className="type-heading-xl text-ink leading-tight">
                  Pins You Haven&apos;t Opened
                </h1>
                <p className="type-body-md text-mute max-w-xl mt-2">
                  Find sites you saved but haven&apos;t visited in a while.
                  Rediscover useful bookmarks or prune what you no longer need.
                </p>
              </div>

              {staleSites.length > 0 && (
                <button
                  onClick={handleSurpriseMe}
                  className="btn-secondary self-start sm:self-auto shrink-0 inline-flex items-center gap-2"
                  title="Open a random forgotten pin in a new tab"
                >
                  <Shuffle className="h-4 w-4" />
                  <span>Surprise Me</span>
                </button>
              )}
            </div>

            {/* Inactivity Threshold Pills */}
            <div className="pt-4 border-t border-hairline flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-mute uppercase tracking-wider mr-1 inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Inactive:
              </span>
              {thresholdsList.map((t) => {
                const count = thresholdCounts[t.value];
                const active = threshold === t.value;
                return (
                  <button
                    key={String(t.value)}
                    onClick={() => {
                      setThreshold(t.value);
                      setSelectedCategory("All");
                    }}
                    className={`${
                      active ? "filter-chip-active" : "filter-chip"
                    } inline-flex items-center gap-1.5 transition-all`}
                  >
                    <span>{t.label}</span>
                    <span
                      className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-hairline text-mute"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Category filter pills if available */}
            {availableCategories.length > 2 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                <span className="text-xs font-bold text-mute mr-1">
                  Category:
                </span>
                {availableCategories.map((cat) => {
                  const active =
                    selectedCategory.toLowerCase() === cat.toLowerCase();
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                        active
                          ? "bg-ink text-canvas font-bold"
                          : "bg-surface-card hover:bg-hairline text-ink"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Pins Section */}
        <section className="mx-auto max-w-content px-4 md:px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="type-heading-md text-ink">
                {threshold === "never"
                  ? "Never Opened Pins"
                  : `Unopened for ${threshold}+ Days`}
              </h2>
              <p className="text-xs text-mute mt-0.5">
                {staleSites.length} pin{staleSites.length === 1 ? "" : "s"}{" "}
                found
              </p>
            </div>

            {selectedCategory !== "All" && (
              <button
                onClick={() => setSelectedCategory("All")}
                className="type-button-sm text-ink-soft hover:underline"
              >
                Clear category filter
              </button>
            )}
          </div>

          {loading ? (
            <PinGridSkeleton count={8} />
          ) : staleSites.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {staleSites.map((site) => {
                const info = siteInactivityMap.get(site.id);
                const daysInactive = info?.daysInactive ?? 0;
                const neverOpened = info?.neverOpened ?? true;
                const isHF = isHuggingFace(site);
                const hostname = getHostname(site.url);

                return (
                  <div
                    key={site.id}
                    className={`group relative flex flex-col rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${
                      isHF
                        ? "border-amber-200/90 bg-[#FFFDF5] dark:border-amber-800/50 dark:bg-[#231E12]"
                        : "border-hairline bg-canvas"
                    }`}
                  >
                    {/* Top row: Inactivity pill badge + Category */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          neverOpened
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300"
                            : daysInactive >= 30
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
                            : daysInactive >= 15
                            ? "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
                        }`}
                      >
                        <Clock className="h-3 w-3" />
                        {neverOpened
                          ? `Never opened (${daysInactive}d ago)`
                          : `${daysInactive} days inactive`}
                      </span>

                      {site.category && (
                        <span className="text-[11px] font-medium text-mute truncate">
                          {site.category}
                        </span>
                      )}
                    </div>

                    {/* Site Info */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-soft border border-hairline overflow-hidden">
                        {site.favicon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={site.favicon}
                            alt=""
                            className="h-6 w-6 object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : isHF ? (
                          <HuggingFaceIcon className="h-5 w-5" />
                        ) : (
                          <span className="font-bold text-ink">
                            {hostname[0]?.toUpperCase() ?? "?"}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/site/${site.id}`}
                          className="font-bold text-ink hover:underline line-clamp-1 text-[14px]"
                          title={site.title}
                        >
                          {site.title || hostname}
                        </Link>
                        <p className="text-[11px] text-mute truncate mt-0.5">
                          {hostname}
                        </p>
                      </div>
                    </div>

                    {/* Description preview */}
                    {site.description && (
                      <p className="text-xs text-body line-clamp-2 mb-3 flex-1">
                        {site.description}
                      </p>
                    )}

                    {/* Tags preview */}
                    {site.tags && site.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {site.tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="text-[10px] bg-surface-soft border border-hairline px-2 py-0.5 rounded-full text-mute"
                          >
                            #{t}
                          </span>
                        ))}
                        {site.tags.length > 3 && (
                          <span className="text-[10px] text-mute self-center">
                            +{site.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Card Actions Footer */}
                    <div className="mt-auto pt-3 border-t border-hairline flex items-center justify-between gap-1">
                      {confirmDeleteId === site.id ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <span className="text-xs text-destructive font-medium flex-1">
                            Confirm remove?
                          </span>
                          <button
                            onClick={() => handleDelete(site.id)}
                            disabled={isDeleting}
                            className="btn-primary h-7 px-2.5 text-xs bg-destructive"
                            title="Confirm delete"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="btn-secondary h-7 px-2.5 text-xs"
                            title="Cancel"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleCopyUrl(e, site)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-soft hover:bg-hairline text-ink transition-colors"
                              title="Copy URL"
                            >
                              {copiedId === site.id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(site.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-soft hover:bg-rose-50 hover:text-destructive text-mute transition-colors"
                              title="Remove from collection"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <a
                            href={site.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleVisit(site)}
                            className="btn-primary h-8 px-3 text-xs inline-flex items-center gap-1.5"
                          >
                            <span>Visit</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mx-auto max-w-md rounded-2xl border border-hairline bg-canvas p-10 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 mb-4">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="type-heading-md text-ink mb-2">
                All caught up!
              </h3>
              <p className="type-body-sm text-mute mb-6">
                {threshold === "never"
                  ? "You have visited every single pin in your collection at least once!"
                  : `No pins in your collection have been inactive for ${threshold}+ days.`}
              </p>
              <Link href="/collections" className="btn-primary inline-flex">
                Explore Full Collection
              </Link>
            </div>
          )}
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
