import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireEditAccess, requireGoogleAuth } from "@/lib/api-auth";
import { ensureCategoryInSettings } from "@/lib/categories-admin";

export const dynamic = "force-dynamic";

async function getOwnedSite(id: string, uid: string) {
  const db = getAdminDb();
  const snap = await db.collection("sites").doc(id).get();
  if (!snap.exists) return null;
  const data = snap.data();
  if (data?.ownerUid !== uid) return null;
  return { id: snap.id, ...data };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireGoogleAuth(req);
    if (!user) {
      return NextResponse.json(
        { error: "Sign in with Google required.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const site = await getOwnedSite(params.id, user.uid);
    if (!site) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ site });
  } catch (error) {
    console.error("GET /api/sites/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch site" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const access = await requireEditAccess(req);
    if (!access.ok) {
      return NextResponse.json(
        { error: access.error, code: "code" in access ? access.code : undefined },
        { status: access.status }
      );
    }

    const existing = await getOwnedSite(params.id, access.user.uid);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const updates: Record<string, unknown> = {};
    for (const key of [
      "url",
      "title",
      "description",
      "category",
      "tags",
      "imageUrl",
      "favicon",
    ]) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const db = getAdminDb();
    await db.collection("sites").doc(params.id).update(updates);

    if (updates.category && typeof updates.category === "string") {
      await ensureCategoryInSettings(access.user.uid, updates.category);
    }

    const site = await getOwnedSite(params.id, access.user.uid);

    return NextResponse.json({ site });
  } catch (error) {
    console.error("PATCH /api/sites/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to update site" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const access = await requireEditAccess(req);
    if (!access.ok) {
      return NextResponse.json(
        { error: access.error, code: "code" in access ? access.code : undefined },
        { status: access.status }
      );
    }

    const existing = await getOwnedSite(params.id, access.user.uid);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const db = getAdminDb();
    await db.collection("sites").doc(params.id).delete();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/sites/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to delete site" },
      { status: 500 }
    );
  }
}

/** POST /api/sites/[id] — Record open/visit without requiring One Password */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireGoogleAuth(req);
    if (!user) {
      return NextResponse.json(
        { error: "Sign in with Google required.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const db = getAdminDb();
    const docRef = db.collection("sites").doc(params.id);
    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const data = snap.data();
    if (data?.ownerUid !== user.uid) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const now = Date.now();
    const currentCount = typeof data?.visitCount === "number" ? data.visitCount : 0;
    const newCount = currentCount + 1;

    await docRef.update({
      lastOpenedAt: now,
      visitCount: newCount,
    });

    return NextResponse.json({
      ok: true,
      lastOpenedAt: now,
      visitCount: newCount,
    });
  } catch (error) {
    console.error("POST /api/sites/[id] (visit) failed:", error);
    return NextResponse.json(
      { error: "Failed to record visit" },
      { status: 500 }
    );
  }
}
