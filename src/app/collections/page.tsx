"use client";

import { useState, useEffect, useMemo } from "react";
import { getSites, addSite, deleteSite, SavedSite, ApiError } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { useOnePassword } from "@/lib/one-password-context";
import SubNav from "@/components/SubNav";
import RequireAuth from "@/components/RequireAuth";
import AddSiteDialog from "@/components/AddSiteDialog";
import SiteCard from "@/components/SiteCard";
import { Search, Layers, Loader2, X, Filter } from "lucide-react";
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
      toast.success("Pinned to collection", { description: saved.title });
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

  const FilterPanel = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="type-heading-md text-ink">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="type-button-sm text-ink-soft hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      <div>
        <p className="type-button-sm text-mute mb-3 uppercase tracking-wide">
          Category
        </p>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const active =
              (cat === "All" && selectedCategory === "All") ||
              cat.toLowerCase() === selectedCategory.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={active ? "filter-chip-active" : "filter-chip"}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {allTags.length > 0 && (
        <div>
          <p className="type-button-sm text-mute mb-3 uppercase tracking-wide">
            Tags
          </p>
          <div className="flex flex-wrap gap-2">
            {allTags.map(({ tag, count }) => {
              const active = selectedTags.some(
                (t) => t.toLowerCase() === tag.toLowerCase()
              );
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={active ? "filter-chip-active" : "filter-chip"}
                >
                  {tag}
                  <span className="ml-1.5 opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-[12px] text-mute font-medium">
        {sites.length} pins in Firestore
      </p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-surface-soft text-body">
      <SubNav
        onAddSiteClick={async () => {
          const ok = await requireEditAccess();
          if (ok) setIsAddDialogOpen(true);
        }}
      />

      <main className="flex-grow">
        <section className="bg-canvas border-b border-hairline">
          <div className="mx-auto max-w-content px-4 md:px-6 py-8 md:py-10">
            <h1 className="type-heading-xl text-ink mb-2">Explore</h1>
            <p className="type-body-md text-mute max-w-md mb-6">
              Browse every curated site. Filter by category and tags.
            </p>

            <div className="relative max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
              <input
                type="text"
                placeholder="Search title, URL, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-pill pl-11"
              />
            </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {selectedCategory !== "All" && (
                  <span className="pin-overlay-pill inline-flex gap-1.5">
                    {selectedCategory}
                    <button
                      onClick={() => setSelectedCategory("All")}
                      aria-label="Remove category"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedTags.map((tag) => (
                  <span key={tag} className="pin-overlay-pill inline-flex gap-1.5">
                    #{tag}
                    <button onClick={() => toggleTag(tag)} aria-label={`Remove ${tag}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="lg:hidden border-b border-hairline bg-canvas px-4 py-3">
          <button
            onClick={() => setMobileFiltersOpen((v) => !v)}
            className="inline-flex items-center gap-2 type-button-md text-ink"
          >
            <Filter className="h-4 w-4" />
            {mobileFiltersOpen ? "Hide filters" : "Show filters"}
          </button>
          {mobileFiltersOpen && <div className="mt-4 pb-2">{FilterPanel}</div>}
        </div>

        <section className="mx-auto max-w-content px-4 md:px-6 py-8">
          <div className="flex gap-8">
            <aside className="hidden lg:block w-56 shrink-0 sticky top-20 self-start">
              {FilterPanel}
            </aside>

            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-ink mb-4">
                {filteredSites.length} of {sites.length} pins
              </p>

              {loading ? (
                <div className="flex justify-center py-24 text-mute">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredSites.length > 0 ? (
                <div className="pin-masonry">
                  {filteredSites.map((site) => (
                    <SiteCard
                      key={site.id}
                      site={site}
                      onDelete={handleDeleteSite}
                    />
                  ))}
                </div>
              ) : (
                <div className="mx-auto max-w-md rounded-lg bg-surface-card p-10 text-center">
                  <Layers className="h-10 w-10 text-ash mx-auto mb-4" />
                  <h3 className="type-heading-md text-ink mb-2">No pins found</h3>
                  <p className="type-body-sm text-mute mb-6">
                    {sites.length === 0
                      ? "Your collection is empty. Add your first website."
                      : "Nothing matches the current filters."}
                  </p>
                  {sites.length === 0 ? (
                    <button
                      onClick={() => setIsAddDialogOpen(true)}
                      className="btn-primary"
                    >
                      Add your first site
                    </button>
                  ) : (
                    <button onClick={clearFilters} className="btn-secondary">
                      Clear filters
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
