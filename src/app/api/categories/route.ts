import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireEditAccess, requireGoogleAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const DEFAULT_CATEGORIES = [
  "Design",
  "Tech",
  "Dev",
  "Learn",
  "Tool",
  "Inspiration",
  "AI",
  "News",
];

function docId(uid: string) {
  return `categories_${uid}`;
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
    const snap = await db.collection("settings").doc(docId(user.uid)).get();
    const stored = (snap.data()?.names as string[] | undefined) || [];

    const siteSnap = await db
      .collection("sites")
      .where("ownerUid", "==", user.uid)
      .get();
    const fromSites = new Set<string>();
    siteSnap.docs.forEach((d) => {
      const c = (d.data().category as string | undefined)?.trim();
      if (c) fromSites.add(c);
    });

    const merged = Array.from(
      new Set([
        ...(stored.length ? stored : DEFAULT_CATEGORIES),
        ...Array.from(fromSites),
      ])
    ).filter(Boolean);

    return NextResponse.json({ categories: merged });
  } catch (error) {
    console.error("GET /api/categories failed:", error);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const access = await requireEditAccess(req);
    if (!access.ok) {
      return NextResponse.json(
        { error: access.error, code: "code" in access ? access.code : undefined },
        { status: access.status }
      );
    }

    const body = await req.json();
    const names: string[] = Array.isArray(body.names)
      ? body.names.map((n: string) => String(n).trim()).filter(Boolean)
      : [];
    const renames: { from: string; to: string }[] = Array.isArray(body.renames)
      ? body.renames
      : [];
    const deletes: string[] = Array.isArray(body.deletes) ? body.deletes : [];

    if (names.length === 0) {
      return NextResponse.json({ error: "Keep at least one category." }, { status: 400 });
    }

    const db = getAdminDb();
    const uid = access.user.uid;
    const sitesSnap = await db
      .collection("sites")
      .where("ownerUid", "==", uid)
      .get();

    const batch = db.batch();
    let ops = 0;

    for (const doc of sitesSnap.docs) {
      const current = String(doc.data().category || "");
      let next = current;

      for (const del of deletes) {
        if (current.toLowerCase() === String(del).toLowerCase()) {
          next = "Uncategorized";
        }
      }
      for (const r of renames) {
        if (current.toLowerCase() === String(r.from).toLowerCase()) {
          next = String(r.to).trim() || next;
        }
      }

      if (next !== current) {
        batch.update(doc.ref, { category: next });
        ops += 1;
      }
    }

    const finalNames = Array.from(
      new Set(names.map((n) => n.trim()).filter(Boolean))
    );
    if (!finalNames.some((n) => n.toLowerCase() === "uncategorized")) {
      // ok if not present
    }

    batch.set(
      db.collection("settings").doc(docId(uid)),
      {
        ownerUid: uid,
        names: finalNames,
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    await batch.commit();

    return NextResponse.json({ categories: finalNames, updatedSites: ops });
  } catch (error) {
    console.error("PUT /api/categories failed:", error);
    return NextResponse.json({ error: "Failed to save categories" }, { status: 500 });
  }
}
