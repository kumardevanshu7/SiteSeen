import Link from "next/link";

const LEGAL_LINKS = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/contact", label: "Contact" },
  { href: "/explore", label: "Explore Arigato Labs" },
] as const;

export default function SiteFooter({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <footer className="mt-auto bg-canvas border-t border-hairline py-8">
      <div
        className={`mx-auto max-w-content px-4 md:px-6 ${
          compact
            ? "text-center space-y-3"
            : "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
        }`}
      >
        <div className="space-y-2">
          <p className="text-[12px] text-mute">
            © 2026 SiteSeen · Arigato Labs. All Rights Reserved.
          </p>
          {!compact ? (
            <p className="text-[12px] text-ash max-w-md">
              Built by Kumar Devanshu. Contact:{" "}
              <a
                href="mailto:kumardevanshu3001@gmail.com"
                className="hover:text-ink transition-colors"
              >
                kumardevanshu3001@gmail.com
              </a>
            </p>
          ) : null}
        </div>

        <nav
          aria-label="Legal"
          className={`flex flex-wrap gap-x-2 gap-y-1 text-[12px] text-mute ${
            compact ? "justify-center" : ""
          }`}
        >
          {LEGAL_LINKS.map((link, i) => (
            <span key={link.href} className="inline-flex items-center gap-2">
              {i > 0 ? (
                <span className="text-ash select-none" aria-hidden>
                  ·
                </span>
              ) : null}
              <Link
                href={link.href}
                className="hover:text-ink transition-colors"
              >
                {link.label}
              </Link>
            </span>
          ))}
        </nav>
      </div>
    </footer>
  );
}
