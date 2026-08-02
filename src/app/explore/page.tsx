"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import SubNav from "@/components/SubNav";
import SiteSeenMark from "@/components/SiteSeenMark";
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
            alt="Arigato Labs"
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
            Legal Disclaimer &amp; License
          </h2>
          <p className="type-body-sm text-mute">
            Copyright © 2026 Arigato Labs. All Rights Reserved.
          </p>
          <p className="type-body-sm text-mute leading-relaxed">
            Permission is hereby granted, free of charge, to any person obtaining
            a copy of this software and associated documentation files (the
            &quot;Software&quot;), to deal in the Software without restriction,
            including without limitation the rights to use, copy, modify, merge,
            publish, distribute, sublicense, and/or sell copies of the Software,
            and to permit persons to whom the Software is furnished to do so,
            subject to the following conditions:
          </p>
          <p className="type-body-sm text-mute leading-relaxed">
            The above copyright notice and this permission notice shall be
            included in all copies or substantial portions of the Software.
          </p>
          <p className="text-[12px] text-ash leading-relaxed">
            THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY
            KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
            OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
            NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
            BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY.
          </p>
        </footer>
      </main>
    </div>
  );
}
