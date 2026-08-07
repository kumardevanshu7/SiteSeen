"use client";

import LegalShell from "@/components/LegalShell";

export default function TermsPage() {
  return (
    <LegalShell
      title="Terms & Conditions"
      subtitle="Rules for using SiteSeen. Last updated: 2026."
    >
      <section className="space-y-2">
        <h2 className="type-heading-md text-ink">Agreement</h2>
        <p>
          By using <strong className="text-ink">SiteSeen</strong>, you agree to
          these terms. If you do not agree, do not use the app.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="type-heading-md text-ink">The service</h2>
        <p>
          SiteSeen is provided by <strong className="text-ink">Arigato Labs</strong>{" "}
          as a personal website archive — save, organize, and browse pins with
          Google sign-in and One Password protection for edits.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="type-heading-md text-ink">Accounts</h2>
        <p>
          You are responsible for your Google login and for the content you add
          (URLs, titles, tags, categories). Keep your account secure.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="type-heading-md text-ink">Acceptable use</h2>
        <p>
          Do not abuse the service, scrape in ways that harm reliability, upload
          illegal content, attempt to bypass One Password or Auth, or attack the
          app or other users.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="type-heading-md text-ink">Intellectual property</h2>
        <p>
          The Arigato Labs name, logos, and brand assets are owned by Arigato
          Labs. SiteSeen product UI and code are owned by Arigato Labs unless a
          project README states otherwise. Brand assets may not be reused outside
          Arigato Labs apps without permission.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="type-heading-md text-ink">Availability</h2>
        <p>
          The service may change, break, or stop. We do not guarantee uptime or
          that any feature will remain available forever.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="type-heading-md text-ink">Termination</h2>
        <p>
          We may suspend access for abuse. You may stop using SiteSeen anytime
          and request help deleting your data by email.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="type-heading-md text-ink">Governing note</h2>
        <p>
          Disputes are handled under applicable law in the founder&apos;s
          jurisdiction (India), unless later specified otherwise.
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
