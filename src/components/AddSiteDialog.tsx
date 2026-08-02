"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Loader2, Sparkles, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useOnePassword } from "@/lib/one-password-context";
import { getCategories, saveCategories } from "@/lib/db";

interface AddSiteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (site: {
    url: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    imageUrl: string;
    favicon: string;
  }) => Promise<void>;
  onCategoriesChanged?: () => void;
}

const FALLBACK_CATEGORIES = [
  "Design",
  "Tech",
  "Dev",
  "Learn",
  "Tool",
  "Inspiration",
  "AI",
  "News",
];

export default function AddSiteDialog({
  isOpen,
  onClose,
  onSave,
  onCategoriesChanged,
}: AddSiteDialogProps) {
  const { getIdToken } = useAuth();
  const { unlockToken, requireEditAccess } = useOnePassword();

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Design");
  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);
  /** Draft rows keep original name so rename→rename still maps sites correctly. */
  const [draftRows, setDraftRows] = useState<
    { key: string; original: string; name: string }[]
  >([]);
  const [editingCategories, setEditingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [savingCategories, setSavingCategories] = useState(false);

  const [tagsInput, setTagsInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const [imageUrl, setImageUrl] = useState("");
  const [favicon, setFavicon] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const prevFetchedUrlRef = useRef("");

  useEffect(() => {
    if (!isOpen) return;
    setUrl("");
    setTitle("");
    setDescription("");
    setCategory("Design");
    setTagsInput("");
    setTags([]);
    setImageUrl("");
    setFavicon("");
    setIsFetching(false);
    setIsSaving(false);
    setEditingCategories(false);
    setShowCreateInput(false);
    setNewCategoryName("");
    setDraftRows([]);
    prevFetchedUrlRef.current = "";

    (async () => {
      try {
        const token = await getIdToken();
        const list = await getCategories(token);
        const next = list.length ? list : FALLBACK_CATEGORIES;
        setCategories(next);
        if (!next.includes("Design") && next[0]) setCategory(next[0]);
      } catch {
        setCategories(FALLBACK_CATEGORIES);
      }
    })();
  }, [isOpen, getIdToken]);

  const visibleCategories = categories;

  const isValidUrl = (stringUrl: string) => {
    try {
      const cleaned = stringUrl.trim();
      if (!cleaned) return false;
      const pattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
      return pattern.test(cleaned);
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (!isValidUrl(url)) return;

    let activeUrl = url.trim();
    if (!/^https?:\/\//i.test(activeUrl)) {
      activeUrl = "https://" + activeUrl;
    }
    if (activeUrl === prevFetchedUrlRef.current) return;

    const delayDebounceFn = setTimeout(async () => {
      setIsFetching(true);
      prevFetchedUrlRef.current = activeUrl;
      try {
        const res = await fetch(
          `/api/scrape?url=${encodeURIComponent(activeUrl)}`
        );
        if (!res.ok) throw new Error("Metadata fetch failed");
        const data = await res.json();
        if (data.title) setTitle(data.title);
        if (data.description) setDescription(data.description);
        if (data.imageUrl) setImageUrl(data.imageUrl);
        if (data.favicon) setFavicon(data.favicon);
      } catch {
        // keep manual fields
      } finally {
        setIsFetching(false);
      }
    }, 650);

    return () => clearTimeout(delayDebounceFn);
  }, [url]);

  const addTag = () => {
    const parts = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (!parts.length) return;
    setTags((prev) => Array.from(new Set([...prev, ...parts])));
    setTagsInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const startEditCategories = async () => {
    // Entering category edit asks One Password once; rename/delete stay draft until Save.
    const ok = await requireEditAccess({ force: true });
    if (!ok) return;
    setDraftRows(
      categories.map((c) => ({
        key: `${c}-${Math.random().toString(36).slice(2, 8)}`,
        original: c,
        name: c,
      }))
    );
    setEditingCategories(true);
    setShowCreateInput(false);
    setNewCategoryName("");
  };

  const cancelEditCategories = () => {
    setEditingCategories(false);
    setDraftRows([]);
    setNewCategoryName("");
    setShowCreateInput(false);
  };

  const renameDraftCategory = (key: string, nextName: string) => {
    setDraftRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, name: nextName } : row))
    );
  };

  const deleteDraftCategory = (key: string) => {
    setDraftRows((prev) => {
      const row = prev.find((r) => r.key === key);
      if (row && (category === row.name || category === row.original)) {
        setCategory("");
      }
      return prev.filter((r) => r.key !== key);
    });
  };

  const addDraftCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (draftRows.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Category already exists.");
      return;
    }
    setDraftRows((prev) => [
      ...prev,
      {
        key: `new-${Math.random().toString(36).slice(2, 8)}`,
        original: "",
        name,
      },
    ]);
    setCategory(name);
    setNewCategoryName("");
  };

  const saveCategoryEdits = async () => {
    const cleaned = draftRows
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
    const deletes = categories.filter((c) => !keptOriginals.has(c));

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
      setCategories(saved);
      if (!saved.includes(category) && saved[0]) setCategory(saved[0]);
      setEditingCategories(false);
      setDraftRows([]);
      toast.success("Categories saved");
      onCategoriesChanged?.();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save categories.");
    } finally {
      setSavingCategories(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategories) {
      toast.message("Save or cancel category edits first.");
      return;
    }
    if (!url) {
      toast.error("Please enter a URL.");
      return;
    }

    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = "https://" + finalUrl;
    }

    if (!title) {
      toast.error("Please provide a title.");
      return;
    }

    const finalCategory =
      (showCreateInput ? newCategoryName.trim() : category.trim()) ||
      categories[0] ||
      "Uncategorized";

    setIsSaving(true);
    try {
      await onSave({
        url: finalUrl,
        title: title.trim(),
        description: description.trim() || "No description provided.",
        category: finalCategory,
        tags,
        imageUrl: imageUrl || "",
        favicon:
          favicon ||
          `https://www.google.com/s2/favicons?domain=${new URL(finalUrl).hostname}&sz=64`,
      });
      if (
        finalCategory &&
        !categories.some((c) => c.toLowerCase() === finalCategory.toLowerCase())
      ) {
        onCategoriesChanged?.();
      }
      onClose();
    } catch (error) {
      toast.error("Failed to save website.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-canvas p-8 rounded-lg shadow-modal max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1.5 pb-2">
          <DialogTitle className="type-heading-lg text-ink flex items-center gap-2">
            Add Website
          </DialogTitle>
          <DialogDescription className="type-body-sm text-mute">
            Paste a link. SiteSeen will automatically fetch its metadata.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 relative">
            <Label htmlFor="url" className="type-body-sm font-semibold text-ink">
              Link
            </Label>
            <div className="relative">
              <Input
                id="url"
                type="text"
                placeholder="e.g. pinterest.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isSaving || editingCategories}
                className="w-full pr-10 h-11 rounded-md bg-canvas text-ink border-hairline"
                required
              />
              {isFetching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
              {!isFetching && url && isValidUrl(url) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-mute">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title" className="type-body-sm font-semibold text-ink">
              Title
            </Label>
            <Input
              id="title"
              type="text"
              placeholder={isFetching ? "Fetching title..." : "Site Name"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSaving || isFetching || editingCategories}
              className="h-11 rounded-md bg-canvas text-ink border-hairline"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="description"
              className="type-body-sm font-semibold text-ink"
            >
              Description
            </Label>
            <textarea
              id="description"
              placeholder={
                isFetching
                  ? "Fetching description..."
                  : "A little description about this site..."
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving || isFetching || editingCategories}
              rows={2}
              className="w-full p-3 bg-canvas text-ink border border-hairline focus:outline-none focus:ring-2 focus:ring-ring rounded-md type-body-sm"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <div className="flex justify-between items-center gap-2">
              <Label className="type-body-sm font-semibold text-ink">
                Category
              </Label>
              <div className="flex items-center gap-3">
                {!editingCategories ? (
                  <>
                    <button
                      type="button"
                      onClick={startEditCategories}
                      className="type-button-sm text-ink-soft hover:underline inline-flex items-center gap-1"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateInput((v) => !v);
                        setNewCategoryName("");
                      }}
                      className="type-button-sm text-ink-soft hover:underline"
                    >
                      {showCreateInput ? "Select Existing" : "Create New"}
                    </button>
                  </>
                ) : (
                  <span className="text-[11px] text-mute">
                    Rename or delete, then Save
                  </span>
                )}
              </div>
            </div>

            {editingCategories ? (
              <div className="space-y-3 rounded-md border border-hairline bg-surface-soft p-3">
                <div className="space-y-2">
                  {draftRows.map((row) => (
                    <div key={row.key} className="flex items-center gap-2">
                      <Input
                        value={row.name}
                        onChange={(e) =>
                          renameDraftCategory(row.key, e.target.value)
                        }
                        className="h-9 rounded-md bg-canvas text-ink border-hairline"
                      />
                      <button
                        type="button"
                        onClick={() => deleteDraftCategory(row.key)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas text-destructive border border-hairline"
                        title="Delete category"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="New category name..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="h-9 rounded-md bg-canvas text-ink border-hairline"
                  />
                  <button
                    type="button"
                    onClick={addDraftCategory}
                    className="btn-secondary px-3"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex gap-2 pt-1">
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
                    {savingCategories ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    Save
                  </button>
                </div>
              </div>
            ) : showCreateInput ? (
              <Input
                type="text"
                placeholder="Enter custom category..."
                value={newCategoryName}
                onChange={(e) => {
                  setNewCategoryName(e.target.value);
                  setCategory(e.target.value);
                }}
                disabled={isSaving}
                className="h-11 rounded-md bg-canvas text-ink border-hairline"
              />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {visibleCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={
                      category === cat ? "filter-chip-active" : "filter-chip"
                    }
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tags" className="type-body-sm font-semibold text-ink">
              Tags <span className="font-normal text-mute">(comma or enter)</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                type="text"
                placeholder="e.g. typography, darkmode"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSaving || editingCategories}
                className="h-11 rounded-md bg-canvas text-ink border-hairline"
              />
              <button
                type="button"
                onClick={addTag}
                disabled={isSaving || !tagsInput.trim() || editingCategories}
                className="btn-secondary px-3"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1 filter-chip"
                  >
                    <span>{tag}</span>
                    <X
                      className="h-3 w-3 cursor-pointer text-mute hover:text-ink"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-hairline flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || savingCategories}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isFetching || editingCategories}
              className="btn-primary"
            >
              {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
              <span>Save Website</span>
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
