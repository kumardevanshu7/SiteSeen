import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

let adminApp: App | undefined;

/** Google service-account JSON (snake_case) or Admin SDK camelCase fields. */
type AdminCredentialInput = Record<string, string>;

function normalizeAccount(raw: AdminCredentialInput): AdminCredentialInput {
  let privateKey = String(raw.private_key || raw.privateKey || "");
  // Strip accidental wrapping quotes from Vercel env paste
  if (
    (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
    (privateKey.startsWith("'") && privateKey.endsWith("'"))
  ) {
    privateKey = privateKey.slice(1, -1);
  }
  // Vercel often stores literal \n; cert() needs real newlines.
  privateKey = privateKey.replace(/\\n/g, "\n");
  return {
    projectId: String(raw.project_id || raw.projectId || ""),
    clientEmail: String(raw.client_email || raw.clientEmail || ""),
    privateKey,
  };
}

function fromEnvJson(): AdminCredentialInput | null {
  const envVal = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!envVal?.trim()) return null;
  try {
    let value: unknown = envVal.trim();
    // Accidental whole-value quotes around the JSON
    if (
      typeof value === "string" &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = JSON.parse(value);
    }
    const parsed =
      typeof value === "string"
        ? (JSON.parse(value) as AdminCredentialInput)
        : (value as AdminCredentialInput);
    return normalizeAccount(parsed);
  } catch (error) {
    console.error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON:", error);
    return null;
  }
}

function fromEnvFields(): AdminCredentialInput | null {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) return null;

  return normalizeAccount({
    projectId,
    clientEmail,
    privateKey,
  });
}

function fromLocalFile(): AdminCredentialInput | null {
  const keyPath = join(process.cwd(), "scripts", "serviceAccountKey.json");
  if (!existsSync(keyPath)) return null;
  try {
    return normalizeAccount(
      JSON.parse(readFileSync(keyPath, "utf-8")) as AdminCredentialInput
    );
  } catch (error) {
    console.error("Failed to read scripts/serviceAccountKey.json:", error);
    return null;
  }
}

function getServiceAccount(): AdminCredentialInput {
  // Prefer split env fields — more reliable on Vercel than a giant JSON blob.
  const account = fromEnvFields() || fromEnvJson() || fromLocalFile();
  if (!account) {
    throw new Error(
      "Firebase Admin credentials missing. Set FIREBASE_ADMIN_PROJECT_ID + CLIENT_EMAIL + PRIVATE_KEY (or FIREBASE_SERVICE_ACCOUNT_JSON)."
    );
  }
  if (!account.privateKey?.includes("BEGIN") || !account.clientEmail) {
    throw new Error(
      "Firebase Admin credentials incomplete — private_key must include BEGIN PRIVATE KEY. Prefer FIREBASE_ADMIN_* split env vars on Vercel."
    );
  }
  return account;
}

export function getAdminApp(): App {
  if (adminApp) return adminApp;

  if (getApps().length > 0) {
    adminApp = getApps()[0]!;
    return adminApp;
  }

  const serviceAccount = getServiceAccount();
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    serviceAccount.projectId ||
    serviceAccount.project_id;

  adminApp = initializeApp({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    credential: cert(serviceAccount as any),
    projectId,
  });

  return adminApp;
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export async function verifyIdToken(token: string) {
  return getAdminAuth().verifyIdToken(token);
}
