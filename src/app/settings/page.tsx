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
    <div className="min-h-screen flex flex-col bg-surface-soft text-body">
      <SubNav onAddSiteClick={handleAddClick} />

      <main className="flex-grow">
        <section className="bg-canvas border-b border-hairline">
          <div className="mx-auto max-w-[720px] px-4 md:px-6 py-8 md:py-10">
            <Link
              href="/collections"
              className="inline-flex items-center gap-1.5 type-body-sm text-mute hover:text-ink mb-6"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Explore
            </Link>
            <h1 className="type-heading-xl text-ink">Settings</h1>
            <p className="mt-2 type-body-md text-mute">
              Security and account controls for SiteSeen.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[720px] px-4 md:px-6 py-10 space-y-6">
          <div className="rounded-md bg-canvas overflow-hidden border border-hairline">
            <div className="px-6 py-5 border-b border-hairline flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-surface-card shrink-0">
                  <ShieldCheck className="h-4 w-4 text-ink" />
                </div>
                <div>
                  <h2 className="type-heading-md text-ink">One Password</h2>
                  <p className="type-body-sm text-mute mt-1">
                    Single security question + answer. Required before any edit.
                  </p>
                </div>
              </div>
              <span
                className={`shrink-0 pin-overlay-pill ${
                  unlocked ? "bg-success-pale text-success-deep" : ""
                }`}
              >
                {unlocked ? (
                  <>
                    <Unlock className="h-3 w-3 mr-1 inline" /> Unlocked
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3 mr-1 inline" /> Locked
                  </>
                )}
              </span>
            </div>

            <div className="px-6 py-6">
              {mode === "setup" ? (
                <div className="space-y-4 max-w-md">
                  <div className="flex items-center gap-2 type-body-strong text-ink mb-1">
                    <KeyRound className="h-4 w-4" />
                    First-time setup
                  </div>
                  <div className="space-y-2">
                    <Label>Security question</Label>
                    <Input
                      placeholder="e.g. What was the name of your first school?"
                      value={setupQuestion}
                      onChange={(e) => setSetupQuestion(e.target.value)}
                      maxLength={200}
                      className="h-11 rounded-md"
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
                      className="h-11 rounded-md"
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
                      className="h-11 rounded-md"
                    />
                  </div>
                  <button
                    onClick={handleSetup}
                    disabled={busy}
                    className="btn-primary"
                  >
                    {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Save One Password
                  </button>
                </div>
              ) : mode === "change" ? (
                <div className="space-y-4 max-w-md">
                  <p className="type-body-sm text-mute">
                    Enter your current answer, then set a new question and answer.
                  </p>
                  <div className="rounded-md bg-surface-card px-4 py-3">
                    <p className="text-[12px] text-mute mb-1">Current question</p>
                    <p className="type-body-strong text-ink">{question}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Current answer</Label>
                    <Input
                      type="password"
                      autoComplete="off"
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      className="h-11 rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>New question</Label>
                    <Input
                      value={setupQuestion}
                      onChange={(e) => setSetupQuestion(e.target.value)}
                      maxLength={200}
                      className="h-11 rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>New answer</Label>
                    <Input
                      type="password"
                      autoComplete="off"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      className="h-11 rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm new answer</Label>
                    <Input
                      type="password"
                      autoComplete="off"
                      value={confirmAnswer}
                      onChange={(e) => setConfirmAnswer(e.target.value)}
                      className="h-11 rounded-md"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMode("view")}
                      className="btn-secondary"
                      disabled={busy}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleChange}
                      disabled={busy}
                      className="btn-primary"
                    >
                      {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Update
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-md bg-surface-card px-4 py-3">
                    <p className="text-[12px] text-mute mb-1">Active question</p>
                    <p className="type-body-strong text-ink">{question || "—"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!unlocked && (
                      <button
                        onClick={() => requireEditAccess()}
                        className="btn-primary"
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
                        className="btn-secondary"
                      >
                        Lock session
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSetupQuestion(question || "");
                        setMode("change");
                      }}
                      className="btn-secondary"
                    >
                      Change question
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-md bg-canvas border border-hairline px-6 py-5">
            <h2 className="type-heading-md text-ink mb-1">Account</h2>
            <p className="type-body-sm text-mute mb-3">Google Authentication only.</p>
            <p className="type-body-md text-ink">{user?.email}</p>
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
