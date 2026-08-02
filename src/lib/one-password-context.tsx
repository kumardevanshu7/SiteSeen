"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useAuth } from "./auth-context";

const UNLOCK_KEY = "siteseen_one_password_unlock";

type GateMode = "unlock" | "setup";

interface OnePasswordContextValue {
  configured: boolean | null;
  question: string | null;
  unlocked: boolean;
  unlockToken: string | null;
  loading: boolean;
  gateOpen: boolean;
  gateMode: GateMode;
  refreshStatus: () => Promise<{ configured: boolean; question: string | null }>;
  requireEditAccess: (opts?: { force?: boolean }) => Promise<boolean>;
  completeGate: (token: string) => void;
  closeGate: () => void;
  openGate: (mode?: GateMode) => void;
  lock: () => void;
  setUnlockToken: (token: string | null) => void;
}

const OnePasswordContext = createContext<OnePasswordContextValue | null>(null);

export function OnePasswordProvider({ children }: { children: ReactNode }) {
  const { user, getIdToken, signInWithGoogle } = useAuth();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [question, setQuestion] = useState<string | null>(null);
  const [unlockToken, setUnlockTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateMode, setGateMode] = useState<GateMode>("unlock");
  const resolveRef = useRef<((ok: boolean) => void) | null>(null);

  const setUnlockToken = useCallback((token: string | null) => {
    setUnlockTokenState(token);
    if (typeof window === "undefined") return;
    if (token) sessionStorage.setItem(UNLOCK_KEY, token);
    else sessionStorage.removeItem(UNLOCK_KEY);
  }, []);

  const lock = useCallback(() => setUnlockToken(null), [setUnlockToken]);

  const closeGate = useCallback(() => {
    setGateOpen(false);
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, []);

  const completeGate = useCallback(
    (token: string) => {
      setUnlockToken(token);
      setGateOpen(false);
      resolveRef.current?.(true);
      resolveRef.current = null;
    },
    [setUnlockToken]
  );

  const openGate = useCallback((mode: GateMode = "unlock") => {
    setGateMode(mode);
    setGateOpen(true);
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const token = await getIdToken();
      const res = await fetch("/api/one-password", {
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("status failed");
      const data = await res.json();
      const next = {
        configured: !!data.configured,
        question: (data.question as string) || null,
      };
      setConfigured(next.configured);
      setQuestion(next.question);
      return next;
    } catch {
      setConfigured(null);
      setQuestion(null);
      return { configured: false, question: null };
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    const stored =
      typeof window !== "undefined" ? sessionStorage.getItem(UNLOCK_KEY) : null;
    if (stored) setUnlockTokenState(stored);
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [user, refreshStatus]);

  const requireEditAccess = useCallback(
    async (opts?: { force?: boolean }) => {
      if (!user) {
        await signInWithGoogle();
        return false;
      }

      const status = await refreshStatus();

      if (!opts?.force) {
        const existing =
          unlockToken ||
          (typeof window !== "undefined"
            ? sessionStorage.getItem(UNLOCK_KEY)
            : null);
        if (status.configured && existing) {
          setUnlockTokenState(existing);
          return true;
        }
      } else {
        // Delete/sensitive actions always re-ask
        setUnlockToken(null);
      }

      setGateMode(status.configured ? "unlock" : "setup");
      setGateOpen(true);

      return new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
      });
    },
    [user, signInWithGoogle, refreshStatus, unlockToken, setUnlockToken]
  );

  return (
    <OnePasswordContext.Provider
      value={{
        configured,
        question,
        unlocked: !!unlockToken,
        unlockToken,
        loading,
        gateOpen,
        gateMode,
        refreshStatus,
        requireEditAccess,
        completeGate,
        closeGate,
        openGate,
        lock,
        setUnlockToken,
      }}
    >
      {children}
    </OnePasswordContext.Provider>
  );
}

export function useOnePassword() {
  const ctx = useContext(OnePasswordContext);
  if (!ctx) {
    throw new Error("useOnePassword must be used within OnePasswordProvider");
  }
  return ctx;
}
