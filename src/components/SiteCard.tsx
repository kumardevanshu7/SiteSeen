"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SavedSite } from "@/lib/db";
import { useOnePassword } from "@/lib/one-password-context";
import { ArrowUpRight, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";

interface SiteCardProps {
  site: SavedSite;
  onDelete: (id: string) => Promise<void>;
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function SiteCard({ site, onDelete }: SiteCardProps) {
  const router = useRouter();
  const { requireEditAccess } = useOnePassword();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const hostname = getHostname(site.url);
  const title = (site.title || "").trim() || hostname;
  const showHost =
    title.toLowerCase() !== hostname.toLowerCase() &&
    title.toLowerCase() !== `www.${hostname}`.toLowerCase();
  const hasImage = Boolean(site.imageUrl) && !imgFailed;

  const handleCardClick = () => {
    try {
      sessionStorage.removeItem("siteseen_slide_back");
      sessionStorage.setItem(`siteseen_site_${site.id}`, JSON.stringify(site));
    } catch {
      // ignore quota
    }
    router.prefetch(`/site/${site.id}`);
    router.push(`/site/${site.id}`);
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await requireEditAccess({ force: true });
    if (!ok) return;
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
      className="group cursor-pointer select-none"
      onClick={handleCardClick}
      onPointerEnter={() => router.prefetch(`/site/${site.id}`)}
    >
      <div className="relative aspect-square overflow-hidden rounded-md border border-hairline bg-surface-card">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={site.imageUrl}
            alt={title}
            className="absolute inset-0 h-full w-full object-contain p-6"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {site.favicon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={site.favicon}
                alt=""
                className="h-14 w-14 rounded-xl bg-canvas object-contain p-2 shadow-sm"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-canvas type-heading-md text-ink shadow-sm">
                {hostname[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
        )}

        {site.category ? (
          <span className="pin-overlay-pill absolute left-2.5 top-2.5 shadow-sm">
            {site.category}
          </span>
        ) : null}

        <div
          className="pointer-events-none absolute inset-0 transition-colors group-hover:bg-ink/5"
          aria-hidden
        />

        <div
          className="absolute right-2.5 top-2.5 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          {confirmDelete ? (
            <div className="flex items-center gap-1 rounded-full bg-canvas px-1.5 py-1 shadow-modal">
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
                className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas text-ink shadow-sm"
                title="Remove"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas text-ink shadow-sm"
                title="Visit"
                onClick={(e) => e.stopPropagation()}
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </>
          )}
        </div>
      </div>

      <div className="px-0.5 pt-2 h-12">
        <h3 className="truncate type-body-sm font-bold text-ink">{title}</h3>
        <p className="truncate text-[12px] text-mute">
          {showHost ? hostname : "\u00A0"}
        </p>
      </div>
    </article>
  );
}
