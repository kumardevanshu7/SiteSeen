"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSites, addSite, deleteSite, getCategories, saveCategories, SavedSite, ApiError } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { useOnePassword } from "@/lib/one-password-context";
import SubNav from "@/components/SubNav";
import RequireAuth from "@/components/RequireAuth";
import AddSiteDialog from "@/components/AddSiteDialog";
import SiteCard from "@/components/SiteCard";
import { PinGridSkeleton } from "@/components/SiteCardSkeleton";
import SiteFooter from "@/components/SiteFooter";
import { Search, Layers, X, Filter, Tag, Folder, Pencil } from "lucide-react";
import { toast } from "sonner";

type SearchSuggestion = {
  key: string;
  kind: "site" | "tag" | "category";
  label: string;
  sub?: string;
  favicon?: string;
  query: string;
  siteId?: string;
};

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function highlightMatch(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-bold text-ink">{text.slice(idx, idx + q.length)}</span>
      {text.slice(idx + q.length)}
    </>
  );
}

export default function CollectionsPage() {
  return (
    <RequireAuth>
      <CollectionsInner />
    </RequireAuth>
  );
}

function CollectionsInner() {
  const router = useRouter();
  const { user, getIdToken } = useAuth();
  const { unlockToken, requireEditAccess } = useOnePassword();
  const [sites, setSites] = useState<SavedSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [activeSuggest, setActiveSuggest] = useState(0);
  const [slideBack, setSlideBack] = useState(false);
  const [editingCategories, setEditingCategories] = useState(false);
  const [draftCategoryRows, setDraftCategoryRows] = useState<
    { key: string; original: string; name: string }[]
  >([]);
  const [managedCategories, setManagedCategories] = useState<string[]>([]);
  const [savingCategories, setSavingCategories] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const applySlideBack = () => {
      try {
        if (sessionStorage.getItem("siteseen_slide_back") === "1") {
          sessionStorage.removeItem("siteseen_slide_back");
          setSlideBack(false);
          requestAnimationFrame(() => setSlideBack(true));
        }
      } catch {
        // ignore
      }
    };
    applySlideBack();
    window.addEventListener("pageshow", applySlideBack);
    return () => window.removeEventListener("pageshow", applySlideBack);
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      try {
        const token = await getIdToken();
        const [data, cats] = await Promise.all([
          getSites(token),
          getCategories(token).catch(() => [] as string[]),
        ]);
        if (!cancelled) {
          setSites(data);
          setManagedCategories(cats);
        }
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
    const set = new Set<string>([
      ...managedCategories,
      ...sites.map((s) => s.category).filter(Boolean),
    ]);
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [sites, managedCategories]);

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

  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 1) return [] as SearchSuggestion[];

    const items: SearchSuggestion[] = [];
    const seen = new Set<string>();

    for (const site of sites) {
      const host = getHostname(site.url);
      const title = (site.title || "").trim() || host;
      const hay = `${title} ${host} ${site.url} ${site.description || ""}`.toLowerCase();
      if (!hay.includes(q)) continue;
      const key = `site:${site.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        key,
        kind: "site",
        label: title,
        sub: host,
        favicon: site.favicon,
        query: title,
        siteId: site.id,
      });
      if (items.length >= 6) break;
    }

    for (const cat of categories) {
      if (cat === "All") continue;
      if (!cat.toLowerCase().includes(q)) continue;
      const key = `cat:${cat.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        key,
        kind: "category",
        label: cat,
        sub: "Category",
        query: cat,
      });
    }

    for (const { tag } of allTags) {
      if (!tag.toLowerCase().includes(q)) continue;
      const key = `tag:${tag.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        key,
        kind: "tag",
        label: tag,
        sub: "Tag",
        query: tag,
      });
      if (items.filter((i) => i.kind === "tag").length >= 4) break;
    }

    return items.slice(0, 8);
  }, [sites, searchQuery, categories, allTags]);

  useEffect(() => {
    setActiveSuggest(0);
  }, [suggestions]);

  useEffect(() => {
    if (!suggestOpen) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (searchWrapRef.current?.contains(target)) return;
      setSuggestOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [suggestOpen]);

  const applySuggestion = (item: SearchSuggestion) => {
    if (item.kind === "site" && item.siteId) {
      setSearchQuery(item.query);
      setSuggestOpen(false);
      router.push(`/site/${item.siteId}`);
      return;
    }
    if (item.kind === "category") {
      setSelectedCategory(item.query);
      setSearchQuery("");
      setSuggestOpen(false);
      return;
    }
    if (item.kind === "tag") {
      setSelectedTags((prev) =>
        prev.some((t) => t.toLowerCase() === item.query.toLowerCase())
          ? prev
          : [...prev, item.query]
      );
      setSearchQuery("");
      setSuggestOpen(false);
      return;
    }
    setSearchQuery(item.query);
    setSuggestOpen(false);
  };

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

  const startEditCategories = async () => {
    // One Password once when entering edit — not on every rename/delete.
    const ok = await requireEditAccess({ force: true });
    if (!ok) return;
    const list = categories.filter((c) => c !== "All");
    setDraftCategoryRows(
      list.map((c) => ({
        key: `${c}-${Math.random().toString(36).slice(2, 8)}`,
        original: c,
        name: c,
      }))
    );
    setEditingCategories(true);
    toast.message("Category edit unlocked", {
      description: "Rename or delete, then Save. No password until then.",
    });
  };

  const cancelEditCategories = () => {
    setEditingCategories(false);
    setDraftCategoryRows([]);
  };

  const saveCategoryEdits = async () => {
    const cleaned = draftCategoryRows
      .map((r) => ({ ...r, name: r.name.trim() }))
      .filter((r) => r.name);
    if (cleaned.length === 0) {
      toast.error("Keep at least one category.");
      return;
    }

    const names = cleaned.map((r) => r.name);
    const renames = cleaned
      .filter((r) => r.original && r.original !== r.name)
      .map((r) => ({ from: r.original, to: r.name }));
    const keptOriginals = new Set(
      cleaned.map((r) => r.original).filter(Boolean)
    );
    const source = categories.filter((c) => c !== "All");
    const deletes = source.filter((c) => !keptOriginals.has(c));

    setSavingCategories(true);
    try {
      const ok = await requireEditAccess();
      if (!ok) return;
      const token = await getIdToken();
      const unlock =
        unlockToken ||
        (typeof window !== "undefined"
          ? sessionStorage.getItem("siteseen_one_password_unlock")
          : null);
      const saved = await saveCategories(
        { names, renames, deletes },
        token,
        unlock
      );
      setManagedCategories(saved);

      // Refresh pins so renames/deletes show up
      const refreshed = await getSites(token);
      setSites(refreshed);

      if (
        selectedCategory !== "All" &&
        !saved.some((c) => c.toLowerCase() === selectedCategory.toLowerCase())
      ) {
        setSelectedCategory("All");
      }

      setEditingCategories(false);
      setDraftCategoryRows([]);
      toast.success("Categories saved");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save categories.");
    } finally {
      setSavingCategories(false);
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
        <div className="flex items-center justify-between mb-3 gap-2">
          <p className="type-button-sm text-mute uppercase tracking-wide">
            Category
          </p>
          {!editingCategories ? (
            <button
              type="button"
              onClick={startEditCategories}
              className="type-button-sm text-ink-soft hover:underline inline-flex items-center gap-1"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          ) : null}
        </div>

        {editingCategories ? (
          <div className="space-y-3">
            <div className="space-y-2">
              {draftCategoryRows.map((row) => (
                <div key={row.key} className="flex items-center gap-2">
                  <input
                    value={row.name}
                    onChange={(e) =>
                      setDraftCategoryRows((prev) =>
                        prev.map((r) =>
                          r.key === row.key
                            ? { ...r, name: e.target.value }
                            : r
                        )
                      )
                    }
                    className="h-9 w-full rounded-md border border-hairline bg-canvas px-3 text-sm text-ink"
                  />
                  <button
                    type="button"
                    title={`Delete ${row.name}`}
                    onClick={() =>
                      setDraftCategoryRows((prev) =>
                        prev.filter((r) => r.key !== row.key)
                      )
                    }
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-hairline bg-canvas text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-mute">
              Deleted categories move pins to Uncategorized on Save.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelEditCategories}
                disabled={savingCategories}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCategoryEdits}
                disabled={savingCategories}
                className="btn-primary flex-1"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const active =
                (cat === "All" && selectedCategory === "All") ||
                cat.toLowerCase() === selectedCategory.toLowerCase();
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={active ? "filter-chip-active" : "filter-chip"}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}
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
    <div
      className={`min-h-screen flex flex-col bg-surface-soft text-body ${
        slideBack ? "page-slide-back-in" : ""
      }`}
    >
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

            <div className="relative max-w-xl" ref={searchWrapRef}>
              <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-mute" />
              <input
                type="text"
                placeholder="Search title, URL, tags..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSuggestOpen(true);
                }}
                onFocus={() => setSuggestOpen(true)}
                onKeyDown={(e) => {
                  if (!suggestOpen || suggestions.length === 0) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActiveSuggest((i) => (i + 1) % suggestions.length);
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActiveSuggest(
                      (i) => (i - 1 + suggestions.length) % suggestions.length
                    );
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    applySuggestion(suggestions[activeSuggest]);
                  } else if (e.key === "Escape") {
                    setSuggestOpen(false);
                  }
                }}
                className="search-pill pl-11"
                autoComplete="off"
                role="combobox"
                aria-controls="explore-search-suggestions"
                aria-expanded={suggestOpen && suggestions.length > 0}
                aria-autocomplete="list"
              />

              {suggestOpen && suggestions.length > 0 && (
                <ul
                  id="explore-search-suggestions"
                  className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-md border border-hairline bg-canvas shadow-modal"
                  role="listbox"
                >
                  {suggestions.map((item, index) => (
                    <li key={item.key} role="option" aria-selected={index === activeSuggest}>
                      <button
                        type="button"
                        onMouseEnter={() => setActiveSuggest(index)}
                        onClick={() => applySuggestion(item)}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                          index === activeSuggest
                            ? "bg-surface-card"
                            : "hover:bg-surface-card"
                        }`}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary overflow-hidden">
                          {item.kind === "site" && item.favicon ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.favicon}
                              alt=""
                              className="h-5 w-5 object-contain"
                            />
                          ) : item.kind === "tag" ? (
                            <Tag className="h-3.5 w-3.5 text-mute" />
                          ) : item.kind === "category" ? (
                            <Folder className="h-3.5 w-3.5 text-mute" />
                          ) : (
                            <Search className="h-3.5 w-3.5 text-mute" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate type-body-sm text-body">
                            {highlightMatch(item.label, searchQuery)}
                          </span>
                          {item.sub ? (
                            <span className="block truncate text-[12px] text-mute">
                              {item.sub}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
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
                <PinGridSkeleton count={8} />
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

      <SiteFooter />

      <AddSiteDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSave={handleSaveSite}
        knownTags={allTags.map(({ tag }) => tag)}
        onCategoriesChanged={async () => {
          try {
            const token = await getIdToken();
            const [cats, data] = await Promise.all([
              getCategories(token),
              getSites(token),
            ]);
            setManagedCategories(cats);
            setSites(data);
          } catch {
            // ignore
          }
        }}
      />
    </div>
  );
}
