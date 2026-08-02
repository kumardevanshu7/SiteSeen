import { NextRequest } from "next/server";
import { verifyIdToken } from "@/lib/firebase-admin";
import { verifyUnlockToken } from "@/lib/one-password";

export async function requireGoogleAuth(req: NextRequest) {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  try {
    return await verifyIdToken(header.slice(7));
  } catch {
    return null;
  }
}

/** Google Auth + valid One Password unlock session required for mutations. */
export async function requireEditAccess(req: NextRequest) {
  const user = await requireGoogleAuth(req);
  if (!user) {
    return { ok: false as const, status: 401, error: "Sign in with Google required." };
  }

  const unlock = req.headers.get("x-one-password-unlock");
  if (!verifyUnlockToken(unlock, user.uid)) {
    return {
      ok: false as const,
      status: 403,
      error: "One Password unlock required before editing.",
      code: "ONE_PASSWORD_LOCKED",
    };
  }

  return { ok: true as const, user };
}
