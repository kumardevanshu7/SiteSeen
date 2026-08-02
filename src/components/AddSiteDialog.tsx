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
import { X, Loader2, Sparkles, Plus } from "lucide-react";
import { toast } from "sonner";

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
}

const DEFAULT_CATEGORIES = [
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
}: AddSiteDialogProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Design");
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  
  const [tagsInput, setTagsInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  
  const [imageUrl, setImageUrl] = useState("");
  const [favicon, setFavicon] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const prevFetchedUrlRef = useRef("");

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setUrl("");
      setTitle("");
      setDescription("");
      setCategory("Design");
      setCustomCategory("");
      setShowCustomCategory(false);
      setTagsInput("");
      setTags([]);
      setImageUrl("");
      setFavicon("");
      setIsFetching(false);
      setIsSaving(false);
      prevFetchedUrlRef.current = "";
    }
  }, [isOpen]);

  // URL validate function
  const isValidUrl = (stringUrl: string) => {
    try {
      const cleaned = stringUrl.trim();
      if (!cleaned) return false;
      
      // Basic regex check for domain.com structure
      const pattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
      return pattern.test(cleaned);
    } catch {
      return false;
    }
  };

  // Debounced auto-fetch site metadata
  useEffect(() => {
    if (!isValidUrl(url)) return;

    let activeUrl = url.trim();
    if (!/^https?:\/\//i.test(activeUrl)) {
      activeUrl = "https://" + activeUrl;
    }

    // Don't fetch if URL hasn't changed from what we just fetched
    if (activeUrl === prevFetchedUrlRef.current) return;

    const delayDebounceFn = setTimeout(async () => {
      setIsFetching(true);
      prevFetchedUrlRef.current = activeUrl;
      
      try {
        const res = await fetch(`/api/scrape?url=${encodeURIComponent(activeUrl)}`);
        if (!res.ok) throw new Error("Metadata fetch failed");
        
        const data = await res.json();
        
        if (data.title) setTitle(data.title);
        if (data.description) setDescription(data.description);
        if (data.imageUrl) setImageUrl(data.imageUrl);
        if (data.favicon) setFavicon(data.favicon);
        
        toast.success("Site details auto-fetched!", {
          description: data.title || activeUrl,
        });
      } catch (err) {
        console.error("Auto-fetch error:", err);
        // Fallback title to hostname if fetch fails — only if user hasn't typed one
        setTitle((prev) => {
          if (prev) return prev;
          try {
            return new URL(activeUrl).hostname;
          } catch {
            return activeUrl;
          }
        });
      } finally {
        setIsFetching(false);
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(delayDebounceFn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // Handle adding tags on comma or enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const cleanTag = tagsInput.trim().replace(/,/g, "");
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
      setTagsInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    setIsSaving(true);
    try {
      const finalCategory = showCustomCategory ? (customCategory.trim() || "Other") : category;
      await onSave({
        url: finalUrl,
        title: title.trim(),
        description: description.trim() || "No description provided.",
        category: finalCategory,
        tags,
        imageUrl: imageUrl || "",
        favicon: favicon || `https://www.google.com/s2/favicons?domain=${new URL(finalUrl).hostname}&sz=64`,
      });
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
      <DialogContent className="sm:max-w-md bg-canvas border border-border/80 p-6 rounded-lg shadow-2xl duration-200">
        <DialogHeader className="space-y-1.5 pb-2">
          <DialogTitle className="text-xl font-semibold tracking-apple-tight text-ink flex items-center gap-2">
            Add Website
          </DialogTitle>
          <DialogDescription className="text-xs text-ink/50 tracking-apple-tight">
            Paste a link. SiteSeen will automatically fetch its metadata.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Link input */}
          <div className="space-y-1.5 relative">
            <Label htmlFor="url" className="text-xs font-semibold text-ink/70">
              Link
            </Label>
            <div className="relative">
              <Input
                id="url"
                type="text"
                placeholder="e.g. apple.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isSaving}
                className="w-full pr-10 bg-canvas text-ink border-border/80 focus-visible:ring-primary focus-visible:border-primary/80 rounded-sm text-sm"
                required
              />
              {isFetching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/80 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
              {!isFetching && url && isValidUrl(url) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/60" title="Valid URL. Auto-fetching...">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold text-ink/70">
              Title
            </Label>
            <Input
              id="title"
              type="text"
              placeholder={isFetching ? "Fetching title..." : "Site Name"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSaving || isFetching}
              className="bg-canvas text-ink border-border/80 focus-visible:ring-primary rounded-sm text-sm"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold text-ink/70">
              Description
            </Label>
            <textarea
              id="description"
              placeholder={isFetching ? "Fetching description..." : "A little description about this site..."}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving || isFetching}
              rows={2}
              className="w-full p-2.5 bg-canvas text-ink border border-border/80 focus-visible:ring-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent rounded-sm text-sm transition-all"
            />
          </div>

          {/* Category Selector */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-semibold text-ink/70">Category</Label>
              <button
                type="button"
                onClick={() => setShowCustomCategory(!showCustomCategory)}
                className="text-[11px] font-normal text-primary hover:text-primary-focus tracking-apple-tight"
              >
                {showCustomCategory ? "Select Existing" : "Create New"}
              </button>
            </div>

            {showCustomCategory ? (
              <Input
                type="text"
                placeholder="Enter custom category..."
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                disabled={isSaving}
                className="bg-canvas text-ink border-border/80 focus-visible:ring-primary rounded-sm text-sm"
                required
              />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1 text-xs tracking-apple-tight rounded-pill border transition-all ${
                      category === cat
                        ? "bg-primary border-primary text-white"
                        : "bg-surface-pearl border-border/60 text-ink/80 hover:border-border"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="tags" className="text-xs font-semibold text-ink/70">
              Tags <span className="text-[10px] font-normal text-ink/40">(comma or enter separated)</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                type="text"
                placeholder="e.g. typography, darkmode"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSaving}
                className="bg-canvas text-ink border-border/80 focus-visible:ring-primary rounded-sm text-sm"
              />
              <button
                type="button"
                onClick={addTag}
                disabled={isSaving || !tagsInput.trim()}
                className="px-3 bg-surface-pearl hover:bg-border/20 border border-border/80 text-ink rounded-sm active:scale-95 transition-all flex items-center justify-center"
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
                    className="flex items-center gap-1 bg-canvas-parchment hover:bg-canvas-parchment text-ink border border-border/60 rounded-pill px-2.5 py-0.5 text-xs font-normal"
                  >
                    <span>{tag}</span>
                    <X
                      className="h-3 w-3 cursor-pointer text-ink/45 hover:text-ink/80 transition-colors"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Dialog Footer */}
          <DialogFooter className="pt-4 border-t border-border/40 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-border/80 hover:bg-surface-pearl active:scale-95 text-ink text-xs font-normal rounded-pill transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isFetching}
              className="px-5 py-2 bg-primary hover:bg-primary-focus active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-normal rounded-pill transition-all shadow-sm flex items-center gap-1.5"
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
