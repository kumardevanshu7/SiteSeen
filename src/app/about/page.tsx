"use client";

import Link from "next/link";
import LegalShell from "@/components/LegalShell";

export default function AboutPage() {
  return (
    <LegalShell
      title="About Arigato Labs"
      subtitle="The company behind SiteSeen."
    >
      <p>
        <strong className="text-ink">SiteSeen</strong> is a product of{" "}
        <strong className="text-ink">Arigato Labs</strong>.
      </p>
      <p>
        Built by <strong className="text-ink">Kumar Devanshu</strong>, founder
        of Arigato Labs (2026).
      </p>
      <p>
        We build sleek, modern, high-performance tools that help people get
        things done with clarity and calm. Software should feel fast, natural,
        and carefully designed.
      </p>
      <p>
        SiteSeen is your personal archive of websites — curated, framed, and
        easy to rediscover — protected with Google sign-in and a One Password
        security question for edits.
      </p>
      <p>
        Questions?{" "}
        <Link href="/contact" className="text-primary hover:underline">
          Contact us
        </Link>
        .
      </p>
      <p className="text-mute pt-4 border-t border-hairline">
        Copyright © 2026 Arigato Labs. All Rights Reserved.
      </p>
    </LegalShell>
  );
}
