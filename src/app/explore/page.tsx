"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import SubNav from "@/components/SubNav";
import SiteSeenMark from "@/components/SiteSeenMark";
import SiteFooter from "@/components/SiteFooter";
import { useAuth } from "@/lib/auth-context";

export default function ExplorePage() {
  const { user, loading } = useAuth();
  const showNav = !loading && !!user;

  return (
    <div className="min-h-screen flex flex-col bg-surface-soft text-body">
      {showNav ? <SubNav showAdd={false} /> : null}

      {!showNav && (
        <header className="h-16 border-b border-hairline bg-canvas flex items-center px-4 md:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 type-body-strong text-[20px] text-primary"
          >
            <SiteSeenMark size={28} className="rounded-md" />
            SiteSeen
          </Link>
        </header>
      )}

      <main className="flex-1 mx-auto w-full max-w-content px-4 md:px-6 py-section">
        <header className="text-center max-w-2xl mx-auto">
          <h1 className="type-display-lg text-ink mb-3">Our Company</h1>
          <p className="type-body-md text-mute">
            Redefining productivity and job tracking for the modern era.
          </p>
        </header>

        <div className="mt-10 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/arigato-labs-logo.png"
            alt="Arigato Labs Logo"
            className="w-full max-w-[650px] h-auto object-contain -my-4"
          />
        </div>

        <div className="mt-8 text-center max-w-2xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-success-pale text-success-deep px-3 py-1.5 type-button-sm">
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            Verified Founder
          </div>

          <p className="type-body-md text-body">
            <strong className="text-ink">SiteSeen</strong> is proudly developed
            by <strong className="text-ink">Kumar Devanshu</strong>, the founder
            of <strong className="text-ink">Arigato Labs</strong> in 2026.
          </p>

          <p className="type-body-sm text-mute leading-relaxed">
            Our mission is to build sleek, modern, and high-performance tools
            that empower individuals and teams to achieve their goals with
            elegance and ease. We believe software should feel natural, fast,
            and distinctly beautiful.
          </p>
        </div>

        <footer className="mt-16 pt-10 border-t border-hairline text-center max-w-3xl mx-auto space-y-4">
          <h2 className="type-heading-md text-ink tracking-wide">
            ARIGATO LABS
          </h2>
          <p className="type-body-sm text-mute">
            Copyright © 2026 Arigato Labs. All Rights Reserved.
          </p>
          <p className="type-body-sm text-mute leading-relaxed">
            <strong className="text-ink">SiteSeen</strong> is a product of
            Arigato Labs, founded by Kumar Devanshu. Brand name and logos may
            not be reused outside Arigato Labs apps without permission.
          </p>
          <p className="text-[12px] text-ash leading-relaxed">
            See{" "}
            <Link href="/privacy" className="hover:text-ink transition-colors">
              Privacy
            </Link>
            ,{" "}
            <Link href="/terms" className="hover:text-ink transition-colors">
              Terms
            </Link>
            , and{" "}
            <Link
              href="/disclaimer"
              className="hover:text-ink transition-colors"
            >
              Disclaimer
            </Link>{" "}
            in this app. Contact:{" "}
            <a
              href="mailto:kumardevanshu3001@gmail.com"
              className="hover:text-ink transition-colors"
            >
              kumardevanshu3001@gmail.com
            </a>
          </p>
          <p className="text-[12px] text-mute flex flex-wrap justify-center gap-x-3 gap-y-1 pt-2">
            <Link href="/about" className="hover:text-ink transition-colors">
              About
            </Link>
            <span className="text-ash">·</span>
            <Link href="/privacy" className="hover:text-ink transition-colors">
              Privacy
            </Link>
            <span className="text-ash">·</span>
            <Link href="/terms" className="hover:text-ink transition-colors">
              Terms
            </Link>
            <span className="text-ash">·</span>
            <Link
              href="/disclaimer"
              className="hover:text-ink transition-colors"
            >
              Disclaimer
            </Link>
            <span className="text-ash">·</span>
            <Link href="/contact" className="hover:text-ink transition-colors">
              Contact
            </Link>
          </p>
        </footer>
      </main>

      <SiteFooter />
    </div>
  );
}
