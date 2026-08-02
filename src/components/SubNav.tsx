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
  Search,
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
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { user, loading, signOut } = useAuth();
  const { lock } = useOnePassword();
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => setDrawerOpen(false), [pathname]);

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
  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  const handleSignOut = async () => {
    lock();
    setDrawerOpen(false);
    await signOut();
  };

  const navLinks = [
    { href: "/", label: "Home", icon: Home, active: isHome },
    {
      href: "/collections",
      label: "Explore",
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
      <header className="sticky top-0 left-0 right-0 z-40 h-16 bg-canvas border-b border-hairline">
        <div className="mx-auto flex h-full max-w-content items-center justify-between gap-3 px-4 md:px-6">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="sm:hidden flex h-10 w-10 items-center justify-center rounded-full bg-surface-card text-ink"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" strokeWidth={2} />
          </button>

          <Link
            href="/"
            className="type-body-strong text-[20px] text-primary select-none shrink-0"
          >
            SiteSeen
          </Link>

          <nav className="hidden sm:flex items-center gap-5 type-body-strong text-ink">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-opacity hover:opacity-70 ${
                  link.active ? "opacity-100" : "opacity-80"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <Link href="/collections" className="relative w-full">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
              <span className="search-pill flex items-center pl-11 text-ash">
                Search your collection...
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {mounted && (
              <button
                onClick={toggleTheme}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-card text-ink"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}

            {!loading && user && (
              <button
                onClick={handleSignOut}
                className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-surface-card overflow-hidden"
                title={user.email || "Sign out"}
              >
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
                ) : (
                  <LogOut className="h-4 w-4 text-ink" />
                )}
              </button>
            )}

            {showAdd && onAddSiteClick && (
              <button onClick={onAddSiteClick} className="btn-primary shrink-0">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Site</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 sm:hidden ${
          drawerOpen ? "visible" : "invisible pointer-events-none"
        }`}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-ink/50 transition-opacity duration-300 ${
            drawerOpen ? "opacity-100" : "opacity-0"
          }`}
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
        />

        <aside
          className={`absolute top-0 left-0 h-full w-[78%] max-w-[300px] bg-canvas flex flex-col transition-transform duration-300 ease-out ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-16 flex items-center justify-between px-4 border-b border-hairline">
            <span className="type-body-strong text-primary text-[18px]">SiteSeen</span>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-card"
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
                  className={`flex items-center gap-3 px-3 py-3 rounded-md type-body-strong transition-colors ${
                    link.active
                      ? "bg-surface-card text-ink"
                      : "text-body hover:bg-surface-card"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-4 py-4 border-t border-hairline space-y-3">
            {mounted && (
              <button
                type="button"
                onClick={toggleTheme}
                className="btn-secondary w-full"
              >
                {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                {isDark ? "Light mode" : "Dark mode"}
              </button>
            )}
            {user && (
              <div className="flex items-center gap-3 px-1">
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-surface-card flex items-center justify-center type-button-md text-ink">
                    {(user.email || "U")[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="type-body-sm font-semibold text-ink truncate">
                    {user.displayName || "Signed in"}
                  </p>
                  <p className="text-[12px] text-mute truncate">{user.email}</p>
                </div>
              </div>
            )}
            <button type="button" onClick={handleSignOut} className="btn-secondary w-full">
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
