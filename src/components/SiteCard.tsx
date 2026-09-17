"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SavedSite, recordSiteVisit } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { useOnePassword } from "@/lib/one-password-context";
import { ArrowUpRight, Trash2, Check, X, Copy } from "lucide-react";
import { toast } from "sonner";
import { HuggingFaceIcon, isHuggingFace } from "@/components/HuggingFace";

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
  const { getIdToken } = useAuth();
  const { requireEditAccess } = useOnePassword();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  const hostname = getHostname(site.url);
  const title = (site.title || "").trim() || hostname;
  const showHost =
    title.toLowerCase() !== hostname.toLowerCase() &&
    title.toLowerCase() !== `www.${hostname}`.toLowerCase();
  const hasImage = Boolean(site.imageUrl) && !imgFailed;
  const isHF = isHuggingFace(site);

  const handleCardClick = () => {
    try {
      sessionStorage.removeItem("siteseen_slide_back");
      sessionStorage.setItem(`siteseen_site_${site.id}`, JSON.stringify(site));
    } catch {
      // ignore quota
    }
    // Record visit asynchronously in background
    getIdToken()
      .then((token) => recordSiteVisit(site.id, token))
      .catch(() => {});

    router.prefetch(`/site/${site.id}`);
    router.push(`/site/${site.id}`);
  };

  const handleCopyUrl = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(site.url);
      setCopied(true);
      toast.success("URL copied to clipboard!", { description: site.url });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  const handleVisitClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    getIdToken()
      .then((token) => recordSiteVisit(site.id, token))
      .catch(() => {});
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
      <div
        className={`relative aspect-square overflow-hidden rounded-md transition-colors ${
          isHF
            ? "border border-amber-200/90 bg-[#FFF9DB] shadow-[0_1px_3px_rgba(245,158,11,0.08)] dark:border-amber-800/50 dark:bg-[#282110]"
            : "border border-hairline bg-surface-card"
        }`}
      >
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
            {isHF ? (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/85 p-2.5 shadow-sm border border-amber-200/60 dark:bg-black/40 dark:border-amber-700/40">
                <HuggingFaceIcon className="h-10 w-10" />
              </div>
            ) : site.favicon ? (
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

        {isHF ? (
          <span className="pin-overlay-pill absolute left-2.5 top-2.5 shadow-sm inline-flex items-center gap-1.5 border border-amber-300/50 bg-canvas/95 backdrop-blur-sm">
            <HuggingFaceIcon className="h-3.5 w-3.5 shrink-0" />
            <span>{site.category || "Hugging Face"}</span>
          </span>
        ) : site.category ? (
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
                onClick={handleCopyUrl}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas text-ink shadow-sm hover:scale-105 transition-transform"
                title="Copy URL"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas text-ink shadow-sm hover:text-destructive hover:scale-105 transition-all"
                title="Remove"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas text-ink shadow-sm hover:scale-105 transition-transform"
                title="Visit site"
                onClick={handleVisitClick}
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
