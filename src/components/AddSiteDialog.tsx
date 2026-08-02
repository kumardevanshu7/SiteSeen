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
      <DialogContent className="sm:max-w-md bg-canvas p-8 rounded-lg shadow-modal">
        <DialogHeader className="space-y-1.5 pb-2">
          <DialogTitle className="type-heading-lg text-ink flex items-center gap-2">
            Add Website
          </DialogTitle>
          <DialogDescription className="type-body-sm text-mute">
            Paste a link. SiteSeen will automatically fetch its metadata.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Link input */}
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
                disabled={isSaving}
                className="w-full pr-10 h-11 rounded-md bg-canvas text-ink border-hairline"
                required
              />
              {isFetching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
              {!isFetching && url && isValidUrl(url) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-mute" title="Valid URL. Auto-fetching...">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                </div>
              )}
            </div>
          </div>

          {/* Title */}
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
              disabled={isSaving || isFetching}
              className="h-11 rounded-md bg-canvas text-ink border-hairline"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="type-body-sm font-semibold text-ink">
              Description
            </Label>
            <textarea
              id="description"
              placeholder={isFetching ? "Fetching description..." : "A little description about this site..."}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving || isFetching}
              rows={2}
              className="w-full p-3 bg-canvas text-ink border border-hairline focus:outline-none focus:ring-2 focus:ring-ring rounded-md type-body-sm"
            />
          </div>

          {/* Category Selector */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="type-body-sm font-semibold text-ink">Category</Label>
              <button
                type="button"
                onClick={() => setShowCustomCategory(!showCustomCategory)}
                className="type-button-sm text-ink-soft hover:underline"
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
                className="h-11 rounded-md bg-canvas text-ink border-hairline"
                required
              />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_CATEGORIES.map((cat) => (
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

          {/* Tags */}
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
                disabled={isSaving}
                className="h-11 rounded-md bg-canvas text-ink border-hairline"
              />
              <button
                type="button"
                onClick={addTag}
                disabled={isSaving || !tagsInput.trim()}
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
              disabled={isSaving}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isFetching}
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
