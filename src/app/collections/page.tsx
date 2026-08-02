"use client";

import { useState, useEffect, useMemo } from "react";
import { getSites, addSite, deleteSite, SavedSite, ApiError } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { useOnePassword } from "@/lib/one-password-context";
import SubNav from "@/components/SubNav";
import RequireAuth from "@/components/RequireAuth";
import AddSiteDialog from "@/components/AddSiteDialog";
import SiteCard from "@/components/SiteCard";
import { Input } from "@/components/ui/input";
import {
  Search,
  Layers,
  Loader2,
  Tag,
  FolderOpen,
  X,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

export default function CollectionsPage() {
  return (
    <RequireAuth>
      <CollectionsInner />
    </RequireAuth>
  );
}

function CollectionsInner() {
  const { user, getIdToken } = useAuth();
  const { unlockToken, requireEditAccess } = useOnePassword();
  const [sites, setSites] = useState<SavedSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      try {
        const token = await getIdToken();
        const data = await getSites(token);
        if (!cancelled) setSites(data);
      } catch (err) {
        console.error("Failed to load sites", err);
        toast.error("Failed to load sites from Firestore.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, [user, getIdToken]);

  const categories = useMemo(() => {
    const set = new Set(sites.map((s) => s.category).filter(Boolean));
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [sites]);

  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const site of sites) {
      for (const tag of site.tags || []) {
        const key = tag.trim();
        if (!key) continue;
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag, count]) => ({ tag, count }));
  }, [sites]);

  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      const matchesCategory =
        selectedCategory === "All" ||
        site.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((t) =>
          site.tags.some((st) => st.toLowerCase() === t.toLowerCase())
        );

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        site.title.toLowerCase().includes(q) ||
        site.description.toLowerCase().includes(q) ||
        site.url.toLowerCase().includes(q) ||
        site.category.toLowerCase().includes(q) ||
        site.tags.some((t) => t.toLowerCase().includes(q));

      return matchesCategory && matchesTags && matchesSearch;
    });
  }, [sites, selectedCategory, selectedTags, searchQuery]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.some((t) => t.toLowerCase() === tag.toLowerCase())
        ? prev.filter((t) => t.toLowerCase() !== tag.toLowerCase())
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedTags([]);
  };

  const hasActiveFilters =
    searchQuery.length > 0 ||
    selectedCategory !== "All" ||
    selectedTags.length > 0;

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
      setSites((prev) => [saved, ...prev]);
      toast.success("Website successfully curated!", {
        description: saved.title,
      });
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError && err.code === "ONE_PASSWORD_LOCKED") {
        toast.error("Unlock One Password to save.");
      } else {
        toast.error("Failed to save website.");
      }
      throw err;
    }
  };

  const handleDeleteSite = async (id: string) => {
    try {
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
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete website.");
      throw err;
    }
  };

  const FilterSidebar = (
    <aside className="flex flex-col h-full">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold tracking-apple-tight text-ink dark:text-white">
            Filters
          </h2>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-[11px] text-primary dark:text-primary-on-dark hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
        <p className="text-[11px] text-ink/50 dark:text-white/45 leading-relaxed">
          Filter by category and tags from your Firestore archive.
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-1.5 mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink/55 dark:text-white/50">
          <FolderOpen className="h-3.5 w-3.5" />
          Category
        </div>
        <div className="flex flex-col gap-1">
          {categories.map((cat) => {
            const count =
              cat === "All"
                ? sites.length
                : sites.filter(
                    (s) => s.category.toLowerCase() === cat.toLowerCase()
                  ).length;
            const active =
              (cat === "All" && selectedCategory === "All") ||
              cat.toLowerCase() === selectedCategory.toLowerCase();

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-left text-sm transition-colors ${
                  active
                    ? "bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-on-dark font-medium"
                    : "text-ink/75 dark:text-white/70 hover:bg-canvas-parchment dark:hover:bg-white/5"
                }`}
              >
                <span>{cat}</span>
                <span className="text-[11px] font-mono opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <div className="flex items-center gap-1.5 mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink/55 dark:text-white/50">
          <Tag className="h-3.5 w-3.5" />
          Tags
        </div>
        {allTags.length === 0 ? (
          <p className="text-xs text-ink/45 dark:text-white/40 px-1">
            No tags yet. Tags appear here as you archive sites.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {allTags.map(({ tag, count }) => {
              const active = selectedTags.some(
                (t) => t.toLowerCase() === tag.toLowerCase()
              );
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-pill border transition-all ${
                    active
                      ? "bg-primary border-primary text-white"
                      : "bg-transparent border-hairline dark:border-white/15 text-ink/70 dark:text-white/65 hover:border-ink/30 dark:hover:border-white/30"
                  }`}
                >
                  {tag}
                  <span className="opacity-60 font-mono">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-8 pt-4 border-t border-hairline dark:border-white/10 text-[11px] text-ink/45 dark:text-white/40 font-mono">
        {sites.length} sites in database
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink transition-colors">
      <SubNav
        onAddSiteClick={async () => {
          const ok = await requireEditAccess();
          if (ok) setIsAddDialogOpen(true);
        }}
      />

      <main className="flex-grow">
        {/* Page header */}
        <section className="border-b border-border/40 bg-canvas">
          <div className="mx-auto max-w-[1200px] px-4 md:px-6 py-8 md:py-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-primary dark:text-primary-on-dark mb-2">
                  Archive
                </p>
                <h1 className="text-3xl md:text-4xl font-bold tracking-apple-display text-ink dark:text-white leading-tight">
                  Collections
                </h1>
                <p className="mt-2 text-sm text-ink-muted-80 dark:text-body-muted max-w-md">
                  Browse every curated site. Use the sidebar to filter by category and tags from Firestore.
                </p>
              </div>

              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40 dark:text-white/40" />
                <Input
                  type="text"
                  placeholder="Search sites..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 rounded-pill bg-canvas-parchment dark:bg-surface-tile-3 border-hairline dark:border-white/10"
                />
              </div>
            </div>

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mt-5">
                {selectedCategory !== "All" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-pill bg-primary/10 text-primary dark:text-primary-on-dark">
                    {selectedCategory}
                    <button
                      onClick={() => setSelectedCategory("All")}
                      aria-label="Remove category filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-pill bg-ink/5 dark:bg-white/10 text-ink/80 dark:text-white/80"
                  >
                    #{tag}
                    <button
                      onClick={() => toggleTag(tag)}
                      aria-label={`Remove ${tag} filter`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Mobile filter toggle */}
        <div className="lg:hidden border-b border-border/40 px-4 py-3">
          <button
            onClick={() => setMobileFiltersOpen((v) => !v)}
            className="inline-flex items-center gap-2 text-sm text-ink/80 dark:text-white/80"
          >
            <Filter className="h-4 w-4" />
            {mobileFiltersOpen ? "Hide filters" : "Show filters"}
            {hasActiveFilters && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-white">
                {(selectedCategory !== "All" ? 1 : 0) + selectedTags.length}
              </span>
            )}
          </button>
          {mobileFiltersOpen && (
            <div className="mt-4 pb-2">{FilterSidebar}</div>
          )}
        </div>

        {/* Sidebar + grid */}
        <section className="mx-auto max-w-[1200px] px-4 md:px-6 py-8 md:py-10">
          <div className="flex gap-8 lg:gap-10">
            <div className="hidden lg:block w-56 shrink-0 sticky top-[68px] self-start max-h-[calc(100vh-88px)] overflow-y-auto pr-2">
              {FilterSidebar}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs text-ink/55 dark:text-white/50 tracking-apple-tight">
                  Showing{" "}
                  <span className="font-semibold text-ink dark:text-white">
                    {filteredSites.length}
                  </span>{" "}
                  of {sites.length} sites
                </p>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 text-ink/50">
                  <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                  <p className="text-sm tracking-apple-tight">
                    Loading collection...
                  </p>
                </div>
              ) : filteredSites.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredSites.map((site) => (
                    <SiteCard
                      key={site.id}
                      site={site}
                      onDelete={handleDeleteSite}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 px-4 bg-canvas-parchment dark:bg-surface-tile-2 rounded-lg border border-hairline dark:border-white/10 max-w-md mx-auto">
                  <Layers className="h-10 w-10 text-ink/30 dark:text-white/30 mx-auto mb-4" />
                  <h3 className="text-base font-semibold tracking-apple-tight text-ink dark:text-white mb-1.5">
                    No sites found
                  </h3>
                  <p className="text-sm text-ink-muted-80 dark:text-body-muted leading-relaxed mb-6">
                    {sites.length === 0
                      ? "Your collection is empty. Add your first website to get started."
                      : "Nothing matches the current filters. Try clearing them."}
                  </p>
                  {sites.length === 0 ? (
                    <button
                      onClick={() => setIsAddDialogOpen(true)}
                      className="px-4 py-2 bg-primary hover:bg-primary-focus text-white text-xs rounded-pill transition-all"
                    >
                      Add Your First Site
                    </button>
                  ) : (
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 bg-surface-pearl dark:bg-white/5 border border-hairline dark:border-white/15 text-ink dark:text-white text-xs rounded-pill transition-all"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <AddSiteDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSave={handleSaveSite}
      />
    </div>
  );
}
