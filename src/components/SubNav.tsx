"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Plus,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  LayoutGrid,
  Settings,
  Home,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useOnePassword } from "@/lib/one-password-context";

interface SubNavProps {
  onAddSiteClick?: () => void;
  showAdd?: boolean;
}

export default function SubNav({
  onAddSiteClick,
  showAdd = true,
}: SubNavProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, loading, signOut } = useAuth();
  const { lock } = useOnePassword();
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  const isCollections = pathname?.startsWith("/collections");
  const isSettings = pathname?.startsWith("/settings");
  const isHome = pathname === "/";

  const handleSignOut = async () => {
    lock();
    setDrawerOpen(false);
    await signOut();
  };

  const navLinks = [
    { href: "/", label: "Home", icon: Home, active: isHome },
    {
      href: "/collections",
      label: "Collection",
      icon: LayoutGrid,
      active: isCollections,
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
      active: isSettings,
    },
  ];

  return (
    <>
      <div className="sticky top-0 left-0 right-0 z-40 h-[52px] bg-canvas/80 dark:bg-surface-tile-2/80 backdrop-blur-md border-b border-border/60 transition-colors">
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile hamburger — 3 lines */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="sm:hidden p-1.5 -ml-1 text-ink dark:text-white hover:bg-canvas-parchment dark:hover:bg-white/5 rounded-md transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" strokeWidth={2} />
            </button>

            <Link href="/" className="flex items-center gap-2 min-w-0">
              <span className="font-sans text-[20px] font-semibold tracking-apple-tight text-ink dark:text-white select-none">
                SiteSeen
              </span>
              <span className="hidden md:inline-block h-3.5 w-px bg-border/80" />
              <span className="hidden md:inline-block font-sans text-xs text-ink/60 dark:text-white/60 tracking-apple-tight select-none truncate">
                framed by near-invisible UI
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <nav className="hidden sm:flex items-center gap-5 text-xs tracking-apple-tight text-ink/75 dark:text-white/75 font-normal">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`hover:text-primary dark:hover:text-primary-on-dark transition-colors ${
                    link.active
                      ? "text-primary dark:text-primary-on-dark font-medium"
                      : ""
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-1.5 text-ink/60 dark:text-white/60 hover:text-ink dark:hover:text-white transition-colors rounded-sm"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            )}

            {!loading && user && (
              <button
                onClick={handleSignOut}
                className="hidden sm:flex items-center gap-1.5 text-xs text-ink/70 dark:text-white/70 hover:text-ink dark:hover:text-white transition-colors"
                title={user.email || "Sign out"}
              >
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt=""
                    className="h-6 w-6 rounded-full border border-hairline"
                  />
                ) : (
                  <LogOut className="h-3.5 w-3.5" />
                )}
              </button>
            )}

            {showAdd && onAddSiteClick && (
              <button
                onClick={onAddSiteClick}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-primary hover:bg-primary-focus active:scale-95 text-white font-sans text-xs font-normal rounded-pill shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-2"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden xs:inline sm:inline">Add Site</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile side drawer */}
      <div
        className={`fixed inset-0 z-50 sm:hidden transition-visibility ${
          drawerOpen ? "visible" : "invisible pointer-events-none"
        }`}
        aria-hidden={!drawerOpen}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            drawerOpen ? "opacity-100" : "opacity-0"
          }`}
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
        />

        <aside
          className={`absolute top-0 left-0 h-full w-[78%] max-w-[300px] bg-canvas dark:bg-surface-tile-2 border-r border-border/60 shadow-xl flex flex-col transition-transform duration-300 ease-out ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-[52px] flex items-center justify-between px-4 border-b border-border/60">
            <span className="font-semibold text-[17px] tracking-apple-tight text-ink dark:text-white">
              SiteSeen
            </span>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="p-1.5 text-ink/60 dark:text-white/60 hover:text-ink dark:hover:text-white rounded-md"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-md text-[15px] tracking-apple-tight transition-colors ${
                    link.active
                      ? "bg-primary/10 text-primary dark:text-primary-on-dark font-medium"
                      : "text-ink/80 dark:text-white/80 hover:bg-canvas-parchment dark:hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5 h-4 w-4 shrink-0" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-4 py-4 border-t border-border/60 space-y-3">
            {user && (
              <div className="flex items-center gap-3 px-1">
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt=""
                    className="h-8 w-8 rounded-full border border-hairline"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary">
                    {(user.email || "U")[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-ink dark:text-white truncate">
                    {user.displayName || "Signed in"}
                  </p>
                  <p className="text-[11px] text-ink/50 dark:text-white/45 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs rounded-pill border border-hairline dark:border-white/15 text-ink/80 dark:text-white/80"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
