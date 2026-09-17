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
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useOnePassword } from "@/lib/one-password-context";
import SiteSeenMark from "@/components/SiteSeenMark";

interface SubNavProps {
  onAddSiteClick?: () => void;
  showAdd?: boolean;
}

type NavLink = {
  href: string;
  label: string;
  active: boolean;
  icon?: LucideIcon;
};

function ArigatoIcon({ active }: { active?: boolean }) {
  return (
    <span className="inline-flex items-center justify-center shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/arigato-single-logo.png"
        alt=""
        width={17}
        height={17}
        className="object-contain"
        style={{
          filter: active ? "none" : "grayscale(100%) opacity(0.65)",
        }}
        onError={(e) => {
          (e.target as HTMLElement).style.display = "none";
        }}
      />
    </span>
  );
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
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => setDrawerOpen(false), [pathname]);
  useEffect(() => setProfileOpen(false), [pathname]);

  useEffect(() => {
    if (!profileOpen) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-profile-menu]")) return;
      setProfileOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [profileOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  const isCollections = pathname?.startsWith("/collections");
  const isSuggestions = pathname?.startsWith("/suggestions");
  const isSettings = pathname?.startsWith("/settings");
  const isExplore = pathname?.startsWith("/explore");
  const isHome = pathname === "/";
  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  const handleSignOut = async () => {
    lock();
    setDrawerOpen(false);
    await signOut();
  };

  const navLinks: NavLink[] = [
    { href: "/", label: "Home", icon: Home, active: isHome },
    {
      href: "/collections",
      label: "Explore",
      icon: LayoutGrid,
      active: isCollections,
    },
    {
      href: "/suggestions",
      label: "Suggestions",
      icon: Sparkles,
      active: isSuggestions,
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
      active: isSettings,
    },
  ];

  const arigatoLink = {
    href: "/explore",
    label: "Explore Arigato Labs",
    active: isExplore,
  };

  return (
    <>
      <header className="sticky top-0 left-0 right-0 z-40 h-16 bg-canvas border-b border-hairline">
        <div className="mx-auto flex h-full max-w-content items-center gap-4 md:gap-6 px-4 md:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="sm:hidden flex h-10 w-10 items-center justify-center rounded-full bg-surface-card text-ink shrink-0"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" strokeWidth={2} />
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 type-body-strong text-[20px] text-primary select-none shrink-0"
          >
            <SiteSeenMark size={28} className="rounded-md" />
            SiteSeen
          </Link>

          <nav className="hidden sm:flex items-center gap-6 lg:gap-8 type-body-strong text-ink ml-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-opacity hover:opacity-70 whitespace-nowrap ${
                  link.active ? "opacity-100" : "opacity-70"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex flex-1 justify-center px-4 min-w-0">
            <Link href="/collections" className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
              <span className="search-pill flex items-center pl-11 text-ash truncate">
                Search your collection...
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 ml-auto shrink-0">
            <Link
              href={arigatoLink.href}
              title={arigatoLink.label}
              className={`hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-surface-card ${
                arigatoLink.active ? "ring-1 ring-hairline" : ""
              }`}
            >
              <ArigatoIcon active={arigatoLink.active} />
            </Link>

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
              <div className="relative hidden sm:block" data-profile-menu>
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-card overflow-hidden"
                  aria-label="Profile menu"
                  aria-expanded={profileOpen}
                >
                  {user.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="type-button-md text-ink">
                      {(user.displayName || user.email || "U")[0].toUpperCase()}
                    </span>
                  )}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 rounded-md border border-hairline bg-canvas p-2 shadow-modal">
                    <div className="px-2 py-2 border-b border-hairline mb-1">
                      <p className="type-body-sm font-semibold text-ink truncate">
                        {user.displayName || "Signed in"}
                      </p>
                      <p className="text-[12px] text-mute truncate">{user.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-2 type-body-sm font-semibold text-ink hover:bg-surface-card"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
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
            <span className="inline-flex items-center gap-2 type-body-strong text-primary text-[18px]">
              <SiteSeenMark size={24} className="rounded-md" />
              SiteSeen
            </span>
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
                  {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
                  {link.label}
                </Link>
              );
            })}
            <Link
              href={arigatoLink.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-md type-body-strong transition-colors ${
                arigatoLink.active
                  ? "bg-surface-card text-ink"
                  : "text-body hover:bg-surface-card"
              }`}
            >
              <ArigatoIcon active={arigatoLink.active} />
              {arigatoLink.label}
            </Link>
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
