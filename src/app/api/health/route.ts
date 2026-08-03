import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Safe env presence check — never returns secret values. */
export async function GET() {
  const has = (key: string) => Boolean(process.env[key]?.trim());

  const adminSplit =
    has("FIREBASE_ADMIN_PROJECT_ID") &&
    has("FIREBASE_ADMIN_CLIENT_EMAIL") &&
    has("FIREBASE_ADMIN_PRIVATE_KEY");

  const adminJson = has("FIREBASE_SERVICE_ACCOUNT_JSON");
  const unlock = has("ONE_PASSWORD_UNLOCK_SECRET");
  const publicFirebase = has("NEXT_PUBLIC_FIREBASE_PROJECT_ID");

  let adminInit: "ok" | "fail" = "fail";
  let adminError: string | null = null;
  try {
    const { getAdminApp } = await import("@/lib/firebase-admin");
    getAdminApp();
    adminInit = "ok";
  } catch (error) {
    adminError = error instanceof Error ? error.message : String(error);
  }

  const ok = adminInit === "ok" && unlock && publicFirebase;

  return NextResponse.json(
    {
      ok,
      checks: {
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: publicFirebase,
        ONE_PASSWORD_UNLOCK_SECRET: unlock,
        FIREBASE_ADMIN_SPLIT_FIELDS: adminSplit,
        FIREBASE_SERVICE_ACCOUNT_JSON: adminJson,
        adminInit,
        adminError,
      },
      hint:
        adminInit === "fail"
          ? "Set FIREBASE_ADMIN_PROJECT_ID + FIREBASE_ADMIN_CLIENT_EMAIL + FIREBASE_ADMIN_PRIVATE_KEY on Vercel, then Redeploy."
          : "Admin OK. If /api/sites still fails, check Google Auth token.",
    },
    { status: ok ? 200 : 503 }
  );
}
