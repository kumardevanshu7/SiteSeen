"use client";

import LegalShell from "@/components/LegalShell";

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      subtitle="Last updated: 2026. Plain language about SiteSeen data."
    >
      <section className="space-y-2">
        <h2 className="type-heading-md text-ink">Who we are</h2>
        <p>
          SiteSeen is a product of <strong className="text-ink">Arigato Labs</strong>,
          founded by Kumar Devanshu. Contact:{" "}
          <a
            href="mailto:kumardevanshu3001@gmail.com"
            className="text-primary hover:underline"
          >
            kumardevanshu3001@gmail.com
          </a>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="type-heading-md text-ink">What we collect</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong className="text-ink">Account:</strong> Google Auth provides
            your name, email, and profile photo when you sign in.
          </li>
          <li>
            <strong className="text-ink">Your pins:</strong> URLs, titles,
            descriptions, categories, tags, and image/favicon metadata you
            save to your collection.
          </li>
          <li>
            <strong className="text-ink">Security:</strong> your One Password
            security question and a hashed answer (never stored in plain text
            on the client).
          </li>
          <li>
            <strong className="text-ink">Session:</strong> a temporary unlock
            token in browser session storage after you answer the security
            question.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="type-heading-md text-ink">How we use data</h2>
        <p>
          We use this data to run SiteSeen: sync your pins across devices,
          authenticate you, protect edits with One Password, and keep the
          product reliable. We do not sell your personal data.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="type-heading-md text-ink">Third parties</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong className="text-ink">Google / Firebase</strong> — Auth and
            Firestore storage.
          </li>
          <li>
            <strong className="text-ink">Vercel</strong> — app hosting and
            serverless APIs.
          </li>
          <li>
            Optional contact delivery (e.g. Web3Forms) when you send a message
            through the Contact page.
          </li>
        </ul>
        <p>Each provider has its own privacy policy.</p>
      </section>

      <section className="space-y-2">
        <h2 className="type-heading-md text-ink">Storage &amp; retention</h2>
        <p>
          Pin and account data live in Firebase (cloud) under your user. Unlock
          sessions live only in your browser session storage and expire. You can
          remove pins from the app; for full account deletion, contact us at the
          email above.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="type-heading-md text-ink">Security</h2>
        <p>
          We use reasonable safeguards (Google Auth, server-side Admin SDK,
          hashed One Password answers, deny-all Firestore client rules). No
          system is perfect — please use a strong Google account.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="type-heading-md text-ink">Children</h2>
        <p>
          SiteSeen is not directed at children under 13. If you believe a child
          provided data, contact us and we will help remove it.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="type-heading-md text-ink">Changes</h2>
        <p>
          We may update this policy. Continued use of SiteSeen after changes
          means you accept the updated version.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="type-heading-md text-ink">Contact</h2>
        <p>
          <a
            href="mailto:kumardevanshu3001@gmail.com"
            className="text-primary hover:underline"
          >
            kumardevanshu3001@gmail.com
          </a>
        </p>
      </section>
    </LegalShell>
  );
}
