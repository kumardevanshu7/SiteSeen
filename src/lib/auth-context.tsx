"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "./firebase";
import { toast } from "sonner";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  getIdToken: async () => null,
});

/** Token cache: avoid calling user.getIdToken() on every page action */
interface TokenCache {
  token: string;
  expiresAt: number; // ms timestamp
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const tokenCacheRef = useRef<TokenCache | null>(null);

  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, (next) => {
      setUser(next);
      // Clear cached token whenever the user changes
      tokenCacheRef.current = null;
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) {
      toast.error("Firebase Auth is not configured.");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Signed in with Google");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (
        code === "auth/cancelled-popup-request" ||
        code === "auth/popup-closed-by-user"
      ) {
        return;
      }
      console.error(err);
      toast.error("Google sign-in failed.");
    }
  };

  const signOut = async () => {
    if (!auth) return;
    try {
      tokenCacheRef.current = null;
      sessionStorage.removeItem("siteseen_one_password_unlock");
      localStorage.removeItem("siteseen_bookmarks");
      await firebaseSignOut(auth);
      toast.success("Signed out");
    } catch (err) {
      console.error(err);
      toast.error("Sign-out failed.");
    }
  };

  const getIdToken = async () => {
    if (!user) return null;
    try {
      const now = Date.now();
      const cache = tokenCacheRef.current;
      // Reuse token if it won't expire for another 3 minutes (Firebase tokens last 1h)
      if (cache && cache.expiresAt - now > 3 * 60 * 1000) {
        return cache.token;
      }
      const token = await user.getIdToken();
      // Cache for 55 minutes
      tokenCacheRef.current = { token, expiresAt: now + 55 * 60 * 1000 };
      return token;
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithGoogle, signOut, getIdToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
