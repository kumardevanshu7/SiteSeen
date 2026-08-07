"use client";

import LegalShell from "@/components/LegalShell";

export default function DisclaimerPage() {
  return (
    <LegalShell
      title="Disclaimer"
      subtitle="Limits of liability for SiteSeen and Arigato Labs."
    >
      <p>
        <strong className="text-ink">SiteSeen</strong> and Arigato Labs materials
        are provided <strong className="text-ink">&quot;as is&quot;</strong>{" "}
        without warranties of any kind, express or implied.
      </p>
      <p>
        Arigato Labs is <strong className="text-ink">not liable</strong> for loss
        of data, profits, or damages arising from use or inability to use the
        app, to the maximum extent allowed by law.
      </p>
      <p>
        Productivity tools and automated helpers (including metadata fetched for
        pins) are assistants only — not professional legal, medical, or financial
        advice. Verify anything important yourself.
      </p>
      <p>
        Third-party services (Google, Firebase, Vercel, and any contact or
        hosting providers) have their own terms and privacy policies.
      </p>
      <p className="text-mute pt-4 border-t border-hairline">
        Copyright © 2026 Arigato Labs. All Rights Reserved.
      </p>
    </LegalShell>
  );
}
