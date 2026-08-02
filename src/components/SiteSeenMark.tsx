type SiteSeenMarkProps = {
  size?: number;
  className?: string;
  alt?: string;
};

/** App brand mark from favicon pack */
export default function SiteSeenMark({
  size = 28,
  className = "",
  alt = "SiteSeen",
}: SiteSeenMarkProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/android-chrome-192x192.png"
      alt={alt}
      width={size}
      height={size}
      className={`object-contain select-none ${className}`}
      draggable={false}
    />
  );
}

export function BrandLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4 bg-surface-soft"
      role="status"
      aria-label={label}
    >
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 rounded-2xl bg-secondary animate-pulse" />
        <SiteSeenMark size={40} className="relative z-10 drop-shadow-sm" />
      </div>
      <p className="text-[13px] text-mute">{label}</p>
    </div>
  );
}
