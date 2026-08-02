import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireEditAccess, requireGoogleAuth } from "@/lib/api-auth";

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
