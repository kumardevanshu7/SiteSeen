"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SavedSite } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Trash2, Tag, Calendar, ExternalLink, Check, X } from "lucide-react";
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
    try { return new URL(site.url).hostname; } catch { return site.url; }
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
      toast.success("Site removed successfully");
    } catch {
      toast.error("Failed to remove site");
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
    <div
      className="group relative flex flex-col justify-between bg-canvas dark:bg-surface-tile-2 border border-hairline dark:border-white/10 rounded-lg p-5 hover:border-ink/20 dark:hover:border-white/20 hover:shadow-md dark:hover:shadow-black/30 transition-all select-none cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Site screenshot / fallback */}
      <div
        className="relative aspect-video w-full rounded-sm bg-canvas-parchment dark:bg-surface-tile-3 overflow-hidden border border-hairline/40 dark:border-white/5 mb-4 transition-all duration-300"
        style={{ boxShadow: "rgba(0, 0, 0, 0.08) 0px 4px 12px" }}
      >
        {site.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={site.imageUrl}
            alt={site.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col justify-between p-3.5 bg-gradient-to-br from-surface-pearl to-canvas-parchment dark:from-surface-tile-2 dark:to-surface-tile-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-ink/40 dark:text-white/40 uppercase tracking-widest font-mono">
                SiteSeen Visualizer
              </span>
              <ExternalLink className="h-3 w-3 text-ink/30 dark:text-white/30" />
            </div>
            <div className="flex flex-col items-center justify-center py-2">
              {site.favicon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={site.favicon}
                  alt=""
                  className="h-8 w-8 rounded-sm mb-1.5 object-contain"
                  onError={(e) => (e.target as HTMLElement).style.display = "none"}
                />
              ) : (
                <div className="h-8 w-8 rounded-sm bg-primary/10 flex items-center justify-center font-bold text-primary mb-1.5 text-xs">
                  {hostname[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <span className="text-xs font-semibold text-ink/80 dark:text-white/80 tracking-apple-tight text-center truncate max-w-full px-1">
                {site.title}
              </span>
            </div>
            <div className="w-full bg-canvas/75 dark:bg-surface-tile-1/70 rounded-sm border border-hairline/25 dark:border-white/5 py-1 px-2 text-[10px] text-center text-ink/50 dark:text-white/50 truncate font-sans">
              {hostname}
            </div>
          </div>
        )}

        {/* Favicon badge on image corner */}
        {site.imageUrl && site.favicon && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={site.favicon}
            alt=""
            className="absolute bottom-2 right-2 h-6 w-6 rounded-sm object-contain bg-white/80 dark:bg-surface-tile-2/80 backdrop-blur-sm p-0.5 border border-hairline/30 dark:border-white/10 shadow-sm"
            onError={(e) => (e.target as HTMLElement).style.display = "none"}
          />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.04] dark:group-hover:bg-white/[0.02] transition-colors duration-300" />
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Category + Favicon */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold tracking-apple-tight text-primary dark:text-primary-on-dark uppercase">
              {site.category}
            </span>
            {site.favicon && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={site.favicon}
                alt=""
                className="h-4 w-4 rounded-xs object-contain opacity-70"
                onError={(e) => (e.target as HTMLElement).style.display = "none"}
              />
            )}
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold tracking-apple-tight text-ink dark:text-white line-clamp-1 mb-1.5">
            {site.title}
          </h3>

          {/* Description */}
          <p className="text-sm font-normal text-ink-muted-80 dark:text-body-muted leading-relaxed line-clamp-2 mb-4">
            {site.description}
          </p>
        </div>

        {/* Tags + Toolbar */}
        <div className="space-y-4">
          {site.tags && site.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {site.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-canvas-parchment dark:bg-surface-tile-3 text-ink/70 dark:text-white/70 border border-hairline/50 dark:border-white/5 rounded-sm px-1.5 py-0.5 text-[10px] font-normal"
                >
                  <Tag className="h-2 w-2 mr-1 opacity-50" />
                  {tag}
                </Badge>
              ))}
              {site.tags.length > 3 && (
                <Badge
                  variant="secondary"
                  className="bg-canvas-parchment dark:bg-surface-tile-3 text-ink/40 dark:text-white/30 border border-hairline/50 dark:border-white/5 rounded-sm px-1.5 py-0.5 text-[10px] font-normal"
                >
                  +{site.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Bottom bar */}
          <div className="flex items-center justify-between pt-3 border-t border-hairline/40 dark:border-white/5 text-xs text-ink-muted-48 dark:text-body-muted">
            <span className="flex items-center gap-1 text-[11px]">
              <Calendar className="h-3 w-3 opacity-60" />
              {new Date(site.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>

            {/* Actions — stop propagation so card doesn't navigate */}
            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
              {confirmDelete ? (
                <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                  <span className="text-[10px] text-ink/50 dark:text-white/40">Remove?</span>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className="p-1 rounded-sm bg-red-500/10 hover:bg-red-500/20 text-red-500 active:scale-95 transition-all"
                    title="Confirm"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    className="p-1 rounded-sm hover:bg-ink/5 dark:hover:bg-white/5 text-ink/40 dark:text-white/40 active:scale-95 transition-all"
                    title="Cancel"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  className="p-1 hover:text-red-500 active:scale-95 transition-all"
                  title="Remove site"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}

              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 text-xs font-semibold tracking-apple-tight text-primary dark:text-primary-on-dark hover:underline transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <span>Visit</span>
                <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
