"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SavedSite } from "@/lib/db";
import { ArrowUpRight, Trash2, Check, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface SiteCardProps {
  site: SavedSite;
  onDelete: (id: string) => Promise<void>;
}

export default function SiteCard({ site, onDelete }: SiteCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const hostname = (() => {
    try {
      return new URL(site.url).hostname;
    } catch {
      return site.url;
    }
  })();

  const handleCardClick = () => {
    router.push(`/site/${site.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDelete(true);
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await onDelete(site.id);
      toast.success("Pin removed");
    } catch {
      toast.error("Failed to remove");
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDelete(false);
  };

  return (
    <article
      className="group relative cursor-pointer select-none overflow-hidden rounded-md bg-surface-card"
      onClick={handleCardClick}
    >
      {/* Full-bleed pin image — no padding */}
      <div className="relative w-full overflow-hidden bg-surface-card">
        {site.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={site.imageUrl}
            alt={site.title}
            className="block w-full h-auto object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : (
          <div className="flex aspect-[3/4] flex-col items-center justify-center gap-3 p-6 text-center">
            {site.favicon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={site.favicon}
                alt=""
                className="h-10 w-10 rounded-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-canvas type-heading-md text-ink">
                {hostname[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <ExternalLink className="h-4 w-4 text-ash" />
          </div>
        )}

        {/* Category overlay pill */}
        {site.category && (
          <span className="pin-overlay-pill absolute left-3 top-3 shadow-sm">
            {site.category}
          </span>
        )}

        {/* Hover actions */}
        <div
          className="absolute inset-0 bg-ink/0 transition-colors group-hover:bg-ink/10"
          aria-hidden
        />
        <div
          className="absolute right-3 top-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          {confirmDelete ? (
            <div className="flex items-center gap-1 rounded-full bg-canvas px-2 py-1.5 shadow-modal">
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
                title="Confirm"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleCancelDelete}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-card text-ink"
                title="Cancel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas text-ink shadow-sm"
                title="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas text-ink shadow-sm"
                title="Visit"
                onClick={(e) => e.stopPropagation()}
              >
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </>
          )}
        </div>
      </div>

      {/* Meta under pin */}
      <div className="px-1 pt-2 pb-3">
        <h3 className="type-body-sm font-bold text-ink line-clamp-2 leading-snug">
          {site.title}
        </h3>
        <p className="mt-1 text-[12px] text-mute truncate">{hostname}</p>
      </div>
    </article>
  );
}
