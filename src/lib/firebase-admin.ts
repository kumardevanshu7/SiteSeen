import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

let adminApp: App | undefined;

/** Google service-account JSON (snake_case) or Admin SDK camelCase fields. */
type AdminCredentialInput = Record<string, string>;

function fromEnvJson(): AdminCredentialInput | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw?.trim()) return null;
  try {
    return JSON.parse(raw) as AdminCredentialInput;
  } catch (error) {
    console.error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON:", error);
    return null;
  }
}

function fromEnvFields(): AdminCredentialInput | null {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) return null;

  privateKey = privateKey.replace(/\\n/g, "\n");

  return {
    projectId,
    clientEmail,
    privateKey,
  };
}

function fromLocalFile(): AdminCredentialInput | null {
  const keyPath = join(process.cwd(), "scripts", "serviceAccountKey.json");
  if (!existsSync(keyPath)) return null;
  try {
    return JSON.parse(readFileSync(keyPath, "utf-8")) as AdminCredentialInput;
  } catch (error) {
    console.error("Failed to read scripts/serviceAccountKey.json:", error);
    return null;
  }
}

function getServiceAccount(): AdminCredentialInput {
  const account = fromEnvJson() || fromEnvFields() || fromLocalFile();
  if (!account) {
    throw new Error(
      "Firebase Admin credentials missing. Set FIREBASE_SERVICE_ACCOUNT_JSON (or ADMIN fields) in env, or place scripts/serviceAccountKey.json locally."
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
