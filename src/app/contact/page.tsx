"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import LegalShell from "@/components/LegalShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function buildPlainMessage(fields: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  return [
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "  ARIGATO LABS · CONTACT",
    "  Product: SiteSeen",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    `From:     ${fields.name}`,
    `Email:    ${fields.email}`,
    `Subject:  ${fields.subject}`,
    "",
    "Message",
    "-------",
    fields.message,
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "Sent from SiteSeen contact form",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  ].join("\n");
}

function buildHtmlMessage(fields: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  return `
  <div style="font-family:Inter,Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;">
    <div style="background:#e60023;color:#fff;padding:16px 20px;border-radius:12px 12px 0 0;">
      <div style="font-size:12px;letter-spacing:0.08em;opacity:0.9;">ARIGATO LABS · CONTACT</div>
      <div style="font-size:20px;font-weight:700;margin-top:4px;">SiteSeen</div>
    </div>
    <div style="border:1px solid #e8e8e3;border-top:none;padding:20px;border-radius:0 0 12px 12px;background:#fff;">
      <p style="margin:0 0 8px;"><strong>From:</strong> ${escape(fields.name)}</p>
      <p style="margin:0 0 8px;"><strong>Email:</strong> ${escape(fields.email)}</p>
      <p style="margin:0 0 16px;"><strong>Subject:</strong> ${escape(fields.subject)}</p>
      <div style="background:#f6f6f3;border-radius:10px;padding:14px;white-space:pre-wrap;line-height:1.5;">${escape(fields.message)}</div>
      <p style="margin:16px 0 0;font-size:12px;color:#777;">Sent from SiteSeen contact form</p>
    </div>
  </div>`;
}

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (!accessKey) {
      toast.error(
        "Contact form is not configured yet. Email kumardevanshu3001@gmail.com directly."
      );
      return;
    }

    setSending(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      };

      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: accessKey,
          subject: `[SiteSeen] ${payload.subject}`,
          from_name: `Arigato Labs · SiteSeen`,
          replyto: payload.email,
          name: payload.name,
          email: payload.email,
          message: buildPlainMessage(payload),
          html: buildHtmlMessage(payload),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Send failed");
      }

      setSent(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      toast.success("Message sent — we’ll get back to you by email.");
    } catch (err) {
      console.error(err);
      toast.error("Couldn’t send. Try again or email kumardevanshu3001@gmail.com.");
    } finally {
      setSending(false);
    }
  };

  return (
    <LegalShell
      title="Contact Arigato Labs"
      subtitle="Questions about SiteSeen or Arigato Labs? Send a message — it goes to the founder."
    >
      <p className="text-mute">
        Public email:{" "}
        <a
          href="mailto:kumardevanshu3001@gmail.com"
          className="text-primary hover:underline"
        >
          kumardevanshu3001@gmail.com
        </a>
      </p>

      {sent ? (
        <div className="rounded-md border border-hairline bg-canvas p-5 space-y-3">
          <p className="type-body-strong text-ink">
            Message sent — we’ll get back to you by email.
          </p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setSent(false)}
          >
            Send another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="contact-name" className="type-body-sm font-semibold text-ink">
              Name
            </Label>
            <Input
              id="contact-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={sending}
              required
              className="h-11 rounded-md bg-canvas text-ink border-hairline"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-email" className="type-body-sm font-semibold text-ink">
              Email
            </Label>
            <Input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={sending}
              required
              className="h-11 rounded-md bg-canvas text-ink border-hairline"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-subject" className="type-body-sm font-semibold text-ink">
              Subject
            </Label>
            <Input
              id="contact-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={sending}
              required
              className="h-11 rounded-md bg-canvas text-ink border-hairline"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-message" className="type-body-sm font-semibold text-ink">
              Message
            </Label>
            <textarea
              id="contact-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sending}
              required
              rows={6}
              className="w-full p-3 bg-canvas text-ink border border-hairline focus:outline-none focus:ring-2 focus:ring-ring rounded-md type-body-sm"
            />
          </div>

          <button type="submit" disabled={sending} className="btn-primary">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            <span>Send message</span>
          </button>
        </form>
      )}
    </LegalShell>
  );
}
