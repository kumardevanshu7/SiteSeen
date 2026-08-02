"use client";

import { useEffect, useCallback } from "react";
import { SavedSite } from "@/lib/db";
import {
  ArrowUpRight,
  X,
  Calendar,
  Tag,
  Globe,
  Layers,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SiteDetailSheetProps {
  site: SavedSite | null;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

export default function SiteDetailSheet({
  site,
  onClose,
  onDelete,
}: SiteDetailSheetProps) {
  const isOpen = !!site;

  const hostname = site
    ? (() => {
        try {
          return new URL(site.url).hostname;
        } catch {
          return site.url;
        }
      })()
    : "";

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  // Always render — never return null — so CSS transitions actually play
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-all duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Panel — slides in from right */}
      <div
        className={`fixed top-0 right-0 z-[61] h-full w-full max-w-[500px] bg-canvas dark:bg-surface-tile-2 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Only render content when a site is selected */}
        {site && (
          <>
            {/* Sheet Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-hairline dark:border-white/10 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {/* Favicon */}
                {site.favicon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={site.favicon}
                    alt=""
                    className="h-8 w-8 rounded-md object-contain bg-canvas-parchment dark:bg-surface-tile-3 p-0.5 border border-hairline/40 dark:border-white/5 flex-shrink-0"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-md bg-primary/10 border border-hairline/40 dark:border-white/5 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                    {hostname[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-semibold text-primary dark:text-primary-on-dark uppercase tracking-apple-tight">
                    {site.category}
                  </span>
                  <span className="text-xs text-ink/50 dark:text-white/40 font-mono truncate">
                    {hostname}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="ml-4 flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full hover:bg-canvas-parchment dark:hover:bg-surface-tile-3 text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white transition-all active:scale-90"
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto">

              {/* Hero Image */}
              <div className="w-full aspect-video bg-canvas-parchment dark:bg-surface-tile-3 relative overflow-hidden border-b border-hairline/40 dark:border-white/5">
                {site.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={site.imageUrl}
                    alt={site.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-surface-pearl to-canvas-parchment dark:from-surface-tile-2 dark:to-surface-tile-3">
                    {site.favicon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={site.favicon}
                        alt=""
                        className="h-16 w-16 rounded-xl object-contain opacity-50"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    ) : (
                      <Layers className="h-12 w-12 text-ink/20 dark:text-white/20" />
                    )}
                    <span className="text-xs font-mono text-ink/30 dark:text-white/30 tracking-wider">
                      No preview available
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-6">

                {/* Title & Visit CTA */}
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-xl font-semibold tracking-apple-tight text-ink dark:text-white leading-snug">
                    {site.title}
                  </h2>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-focus active:scale-95 text-white text-xs font-semibold rounded-pill shadow-sm transition-all"
                  >
                    Visit
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>

                {/* Description */}
                <p className="text-sm text-ink-muted-80 dark:text-body-muted leading-relaxed">
                  {site.description || "No description available."}
                </p>

                {/* Metadata row */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 py-4 border-y border-hairline/50 dark:border-white/5 text-xs text-ink/50 dark:text-white/40">
                  <div className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" />
                    <span className="font-mono">{hostname}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {new Date(site.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    <span className="text-primary dark:text-primary-on-dark font-semibold uppercase tracking-wider text-[10px]">
                      {site.category}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                {site.tags && site.tags.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="h-3.5 w-3.5 text-ink/40 dark:text-white/40" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-ink/40 dark:text-white/40">
                        Tags
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {site.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="bg-canvas-parchment dark:bg-surface-tile-3 text-ink/70 dark:text-white/60 border border-hairline/60 dark:border-white/5 rounded-pill px-3 py-1 text-xs font-normal"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* URL bar */}
                <div className="p-3 bg-canvas-parchment dark:bg-surface-tile-3 rounded-md border border-hairline/40 dark:border-white/5 flex items-center justify-between gap-3">
                  <span className="text-xs font-mono text-ink/60 dark:text-white/50 truncate">
                    {site.url}
                  </span>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 text-primary dark:text-primary-on-dark hover:opacity-70 transition-opacity"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

              </div>
            </div>

            {/* Sheet Footer */}
            <div className="px-6 py-4 border-t border-hairline dark:border-white/10 flex items-center justify-between flex-shrink-0">
              <button
                onClick={async () => {
                  await onDelete(site.id);
                  onClose();
                }}
                className="text-xs text-red-500/70 hover:text-red-500 transition-colors active:scale-95"
              >
                Remove from collection
              </button>
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-normal border border-hairline dark:border-white/10 rounded-pill hover:bg-canvas-parchment dark:hover:bg-surface-tile-3 text-ink dark:text-white transition-all active:scale-95"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
