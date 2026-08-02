"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SubNav from "@/components/SubNav";
import RequireAuth from "@/components/RequireAuth";
import AddSiteDialog from "@/components/AddSiteDialog";
import { useAuth } from "@/lib/auth-context";
import { useOnePassword } from "@/lib/one-password-context";
import { addSite, SavedSite } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  KeyRound,
  ArrowLeft,
  Loader2,
  Lock,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsInner />
    </RequireAuth>
  );
}

function SettingsInner() {
  const { user, getIdToken } = useAuth();
  const {
    configured,
    question,
    unlocked,
    unlockToken,
    lock,
    setUnlockToken,
    refreshStatus,
    requireEditAccess,
  } = useOnePassword();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [setupQuestion, setSetupQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [confirmAnswer, setConfirmAnswer] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"view" | "setup" | "change">("view");

  useEffect(() => {
    if (configured === false) setMode("setup");
    else if (configured) setMode("view");
  }, [configured]);

  const handleAddClick = async () => {
    const ok = await requireEditAccess();
    if (ok) setIsAddOpen(true);
  };

  const handleSaveSite = async (
    data: Omit<SavedSite, "id" | "createdAt">
  ) => {
    const google = await getIdToken();
    const saved = await addSite(data, google, unlockToken);
    toast.success("Saved to Firestore", { description: saved.title });
  };

  const handleSetup = async () => {
    if (setupQuestion.trim().length < 5) {
      toast.error("Question must be at least 5 characters.");
      return;
    }
    if (answer.trim().length < 2) {
      toast.error("Answer must be at least 2 characters.");
      return;
    }
    if (answer.trim() !== confirmAnswer.trim()) {
      toast.error("Answers do not match.");
      return;
    }

    setBusy(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/one-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: setupQuestion.trim(),
          answer,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Setup failed");
      setUnlockToken(data.unlockToken);
      await refreshStatus();
      setMode("view");
      setSetupQuestion("");
      setAnswer("");
      setConfirmAnswer("");
      toast.success("One Password configured");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Setup failed");
    } finally {
      setBusy(false);
    }
  };

  const handleChange = async () => {
    if (!currentAnswer.trim()) {
      toast.error("Enter your current answer.");
      return;
    }
    if (setupQuestion.trim().length < 5) {
      toast.error("New question must be at least 5 characters.");
      return;
    }
    if (answer.trim().length < 2) {
      toast.error("New answer must be at least 2 characters.");
      return;
    }
    if (answer.trim() !== confirmAnswer.trim()) {
      toast.error("New answers do not match.");
      return;
    }

    setBusy(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/one-password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentAnswer,
          question: setupQuestion.trim(),
          answer,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setUnlockToken(data.unlockToken);
      await refreshStatus();
      setMode("view");
      setCurrentAnswer("");
      setSetupQuestion("");
      setAnswer("");
      setConfirmAnswer("");
      toast.success("One Password updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink transition-colors">
      <SubNav onAddSiteClick={handleAddClick} />

      <main className="flex-grow">
        <section className="border-b border-border/40">
          <div className="mx-auto max-w-[720px] px-4 md:px-6 py-8 md:py-10">
            <Link
              href="/collections"
              className="inline-flex items-center gap-1.5 text-xs text-ink/55 dark:text-white/50 hover:text-ink dark:hover:text-white mb-6"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary dark:text-primary-on-dark mb-2">
              Manage
            </p>
            <h1 className="text-3xl font-bold tracking-apple-display text-ink dark:text-white">
              Settings
            </h1>
            <p className="mt-2 text-sm text-ink-muted-80 dark:text-body-muted">
              Security and account controls for SiteSeen.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[720px] px-4 md:px-6 py-10 space-y-8">
          {/* One Password card */}
          <div className="border border-hairline dark:border-white/10 rounded-lg bg-canvas dark:bg-surface-tile-2 overflow-hidden">
            <div className="px-5 py-4 border-b border-hairline dark:border-white/10 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold tracking-apple-tight">
                    One Password
                  </h2>
                  <p className="text-xs text-ink/55 dark:text-white/50 mt-0.5 leading-relaxed">
                    Single security question + answer. Required before any edit
                    (add, update, delete). No PIN, no pattern.
                  </p>
                </div>
              </div>
              <span
                className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-[10px] font-semibold uppercase tracking-wider ${
                  unlocked
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-ink/5 dark:bg-white/10 text-ink/55 dark:text-white/50"
                }`}
              >
                {unlocked ? (
                  <>
                    <Unlock className="h-3 w-3" /> Session unlocked
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3" /> Locked
                  </>
                )}
              </span>
            </div>

            <div className="px-5 py-5">
              {mode === "setup" ? (
                <div className="space-y-4 max-w-md">
                  <div className="flex items-center gap-2 text-sm font-medium mb-1">
                    <KeyRound className="h-4 w-4 text-primary" />
                    First-time setup
                  </div>
                  <div className="space-y-2">
                    <Label>Security question</Label>
                    <Input
                      placeholder="e.g. What was the name of your first school?"
                      value={setupQuestion}
                      onChange={(e) => setSetupQuestion(e.target.value)}
                      maxLength={200}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Answer</Label>
                    <Input
                      type="password"
                      autoComplete="off"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      maxLength={120}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm answer</Label>
                    <Input
                      type="password"
                      autoComplete="off"
                      value={confirmAnswer}
                      onChange={(e) => setConfirmAnswer(e.target.value)}
                      maxLength={120}
                    />
                  </div>
                  <button
                    onClick={handleSetup}
                    disabled={busy}
                    className="px-4 py-2 bg-primary text-white text-xs rounded-pill hover:bg-primary-focus disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Save One Password
                  </button>
                </div>
              ) : mode === "change" ? (
                <div className="space-y-4 max-w-md">
                  <p className="text-xs text-ink/55 dark:text-white/50">
                    Enter your current answer, then set a new question and
                    answer.
                  </p>
                  <div className="rounded-md bg-canvas-parchment dark:bg-surface-tile-3 border border-hairline dark:border-white/10 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wider text-ink/45 mb-1">
                      Current question
                    </p>
                    <p className="text-sm font-medium">{question}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Current answer</Label>
                    <Input
                      type="password"
                      autoComplete="off"
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>New question</Label>
                    <Input
                      value={setupQuestion}
                      onChange={(e) => setSetupQuestion(e.target.value)}
                      maxLength={200}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>New answer</Label>
                    <Input
                      type="password"
                      autoComplete="off"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm new answer</Label>
                    <Input
                      type="password"
                      autoComplete="off"
                      value={confirmAnswer}
                      onChange={(e) => setConfirmAnswer(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMode("view")}
                      className="px-4 py-2 text-xs rounded-pill border border-hairline dark:border-white/15"
                      disabled={busy}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleChange}
                      disabled={busy}
                      className="px-4 py-2 bg-primary text-white text-xs rounded-pill disabled:opacity-60 flex items-center gap-1.5"
                    >
                      {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Update
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-md bg-canvas-parchment dark:bg-surface-tile-3 border border-hairline dark:border-white/10 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wider text-ink/45 dark:text-white/40 mb-1 font-semibold">
                      Active question
                    </p>
                    <p className="text-sm font-medium text-ink dark:text-white">
                      {question || "—"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!unlocked && (
                      <button
                        onClick={() => requireEditAccess()}
                        className="px-4 py-2 bg-primary text-white text-xs rounded-pill"
                      >
                        Unlock session
                      </button>
                    )}
                    {unlocked && (
                      <button
                        onClick={() => {
                          lock();
                          toast.message("Session locked");
                        }}
                        className="px-4 py-2 text-xs rounded-pill border border-hairline dark:border-white/15"
                      >
                        Lock session
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSetupQuestion(question || "");
                        setMode("change");
                      }}
                      className="px-4 py-2 text-xs rounded-pill border border-hairline dark:border-white/15"
                    >
                      Change question
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account */}
          <div className="border border-hairline dark:border-white/10 rounded-lg px-5 py-4">
            <h2 className="text-sm font-semibold tracking-apple-tight mb-1">
              Account
            </h2>
            <p className="text-xs text-ink/55 dark:text-white/50 mb-3">
              Google Authentication only.
            </p>
            <p className="text-sm text-ink dark:text-white">{user?.email}</p>
          </div>
        </section>
      </main>

      <AddSiteDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleSaveSite}
      />
    </div>
  );
}
