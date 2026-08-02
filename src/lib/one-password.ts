import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

const UNLOCK_TTL_MS = 30 * 60 * 1000; // 30 minutes
const DOC_PATH = "settings/onePassword";

function getUnlockSecret(): string {
  const fromEnv = process.env.ONE_PASSWORD_UNLOCK_SECRET;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ONE_PASSWORD_UNLOCK_SECRET must be set in production (Vercel env)."
    );
  }
  // Local/dev fallback only
  return "siteseen-dev-one-password-unlock-secret";
}

export function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase().replace(/\s+/g, " ");
}

export function hashAnswer(answer: string, salt: string): string {
  return createHash("sha256")
    .update(`${salt}:${normalizeAnswer(answer)}`)
    .digest("hex");
}

export function createSalt(): string {
  return randomBytes(32).toString("hex");
}

export function answersMatch(
  provided: string,
  salt: string,
  storedHash: string
): boolean {
  const computed = hashAnswer(provided, salt);
  try {
    const a = Buffer.from(computed, "hex");
    const b = Buffer.from(storedHash, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export interface UnlockPayload {
  uid: string;
  exp: number;
}

export function issueUnlockToken(uid: string): string {
  const payload: UnlockPayload = {
    uid,
    exp: Date.now() + UNLOCK_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", getUnlockSecret())
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

export function verifyUnlockToken(
  token: string | null | undefined,
  uid: string
): boolean {
  if (!token || !uid) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [body, sig] = parts;
  const expected = createHmac("sha256", getUnlockSecret())
    .update(body)
    .digest("base64url");

  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    ) as UnlockPayload;
    if (payload.uid !== uid) return false;
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) return false;
    return true;
  } catch {
    return false;
  }
}

export { DOC_PATH, UNLOCK_TTL_MS };

export interface OnePasswordDoc {
  question: string;
  answerHash: string;
  salt: string;
  ownerUid: string;
  setupAt: number;
  updatedAt: number;
}
