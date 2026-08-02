"use client";

import { useState } from "react";
import { useOnePassword } from "@/lib/one-password-context";
import { useAuth } from "@/lib/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function OnePasswordGate() {
  const { gateOpen, gateMode, question, closeGate, completeGate, refreshStatus } =
    useOnePassword();
  const { getIdToken } = useAuth();

  const [setupQuestion, setSetupQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [confirmAnswer, setConfirmAnswer] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setSetupQuestion("");
    setAnswer("");
    setConfirmAnswer("");
    setBusy(false);
  };

  const handleClose = () => {
    reset();
    closeGate();
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

      await refreshStatus();
      completeGate(data.unlockToken);
      reset();
      toast.success("One Password is ready. Edit access unlocked.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Setup failed");
    } finally {
      setBusy(false);
    }
  };

  const handleUnlock = async () => {
    if (!answer.trim()) {
      toast.error("Enter your answer.");
      return;
    }
    setBusy(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/one-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Incorrect answer");

      completeGate(data.unlockToken);
      reset();
      toast.success("Unlocked for this session");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unlock failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={gateOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              {gateMode === "setup" ? (
                <KeyRound className="h-4 w-4 text-primary" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-primary" />
              )}
            </div>
            <DialogTitle className="type-heading-lg text-ink">
              One Password
            </DialogTitle>
          </div>
          <DialogDescription className="type-body-md text-mute">
            {gateMode === "setup"
              ? "Set one security question and answer to protect edits. No PIN or pattern — just Q&A."
              : "Answer your security question to unlock editing for this session."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {gateMode === "setup" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="op-q">Security question</Label>
                <Input
                  id="op-q"
                  placeholder="e.g. What city were you born in?"
                  value={setupQuestion}
                  onChange={(e) => setSetupQuestion(e.target.value)}
                  maxLength={200}
                  className="h-11 rounded-md"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="op-a">Your answer</Label>
                <Input
                  id="op-a"
                  type="password"
                  autoComplete="off"
                  placeholder="Private answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  maxLength={120}
                  className="h-11 rounded-md"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="op-ac">Confirm answer</Label>
                <Input
                  id="op-ac"
                  type="password"
                  autoComplete="off"
                  placeholder="Type the same answer again"
                  value={confirmAnswer}
                  onChange={(e) => setConfirmAnswer(e.target.value)}
                  maxLength={120}
                  className="h-11 rounded-md"
                  onKeyDown={(e) => e.key === "Enter" && handleSetup()}
                />
              </div>
            </>
          ) : (
            <>
              <div className="rounded-md bg-surface-card px-4 py-3">
                <p className="text-[12px] text-mute mb-1">Your question</p>
                <p className="type-body-strong text-ink">{question || "—"}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="op-unlock">Answer</Label>
                <Input
                  id="op-unlock"
                  type="password"
                  autoComplete="off"
                  placeholder="Your secret answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  maxLength={120}
                  className="h-11 rounded-md"
                  onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                  autoFocus
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center">
          <Link
            href="/settings"
            onClick={handleClose}
            className="text-[12px] text-mute hover:text-ink-soft order-2 sm:order-1"
          >
            Manage in Settings
          </Link>
          <div className="flex gap-2 order-1 sm:order-2">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={gateMode === "setup" ? handleSetup : handleUnlock}
              disabled={busy}
              className="btn-primary"
            >
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {gateMode === "setup" ? "Create & Unlock" : "Unlock"}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
