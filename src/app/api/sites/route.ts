import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireEditAccess, requireGoogleAuth } from "@/lib/api-auth";
import { ensureCategoryInSettings } from "@/lib/categories-admin";

export const dynamic = "force-dynamic";

export interface SiteDoc {
  url: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  imageUrl?: string;
  favicon?: string;
  createdAt: number;
  ownerUid?: string;
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireGoogleAuth(req);
    if (!user) {
      return NextResponse.json(
        { error: "Sign in with Google required.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const db = getAdminDb();
    const snap = await db
      .collection("sites")
      .where("ownerUid", "==", user.uid)
      .get();

    const sites = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as { id: string; createdAt?: number }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return NextResponse.json({ sites });
  } catch (error) {
    console.error("GET /api/sites failed:", error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to fetch sites", detail },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const access = await requireEditAccess(req);
    if (!access.ok) {
      return NextResponse.json(
        { error: access.error, code: "code" in access ? access.code : undefined },
        { status: access.status }
      );
    }

    const body = await req.json();
    const site: SiteDoc = {
      url: body.url,
      title: body.title,
      description: body.description || "",
      category: body.category || "Uncategorized",
      tags: Array.isArray(body.tags) ? body.tags : [],
      imageUrl: body.imageUrl || "",
      favicon: body.favicon || "",
      createdAt: Date.now(),
      ownerUid: access.user.uid,
    };

    const db = getAdminDb();
    const ref = await db.collection("sites").add(site);

    if (site.category) {
      await ensureCategoryInSettings(access.user.uid, site.category);
    }

    return NextResponse.json({ site: { id: ref.id, ...site } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/sites failed:", error);
    return NextResponse.json(
      { error: "Failed to create site" },
      { status: 500 }
    );
  }
}

/** PATCH /api/sites — Bulk update sites (e.g. change category of multiple selected pins) */
export async function PATCH(req: NextRequest) {
  try {
    const access = await requireEditAccess(req);
    if (!access.ok) {
      return NextResponse.json(
        { error: access.error, code: "code" in access ? access.code : undefined },
        { status: access.status }
      );
    }

    const body = await req.json();
    const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
    const updates = body.updates;

    if (!ids.length || !updates || typeof updates !== "object") {
      return NextResponse.json(
        { error: "Invalid payload: ids array and updates object required." },
        { status: 400 }
      );
    }

    const allowedFields = ["category", "tags", "description", "title"];
    const sanitizedUpdates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        sanitizedUpdates[key] = updates[key];
      }
    }

    const db = getAdminDb();
    const batch = db.batch();

    for (const id of ids) {
      const docRef = db.collection("sites").doc(id);
      batch.update(docRef, sanitizedUpdates);
    }

    await batch.commit();

    if (sanitizedUpdates.category && typeof sanitizedUpdates.category === "string") {
      await ensureCategoryInSettings(access.user.uid, sanitizedUpdates.category);
    }

    return NextResponse.json({ ok: true, updatedCount: ids.length });
  } catch (error) {
    console.error("PATCH /api/sites (bulk) failed:", error);
    return NextResponse.json(
      { error: "Failed to update sites" },
      { status: 500 }
    );
  }
}
