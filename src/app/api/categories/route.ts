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
    const stored = ((snap.data()?.names as string[] | undefined) || [])
      .map((n) => n.trim())
      .filter(Boolean);
    const deleted = ((snap.data()?.deleted as string[] | undefined) || [])
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);
    const deletedNorm = new Set(deleted);

    const siteSnap = await db
      .collection("sites")
      .where("ownerUid", "==", user.uid)
      .get();
    const fromSites = new Set<string>();
    siteSnap.docs.forEach((d) => {
      const c = (d.data().category as string | undefined)?.trim();
      if (c && c.toLowerCase() !== "uncategorized") {
        if (!deletedNorm.has(c.toLowerCase())) {
          fromSites.add(c);
        }
      }
    });

    const mergedSet = new Set<string>();
    // 1. Add all stored categories that aren't marked deleted
    for (const s of stored) {
      if (!deletedNorm.has(s.toLowerCase())) {
        mergedSet.add(s);
      }
    }
    // 2. Add active categories from sites that aren't marked deleted
    fromSites.forEach((c) => mergedSet.add(c));

    let finalCategories = Array.from(mergedSet);
    if (finalCategories.length === 0 && stored.length === 0) {
      finalCategories = DEFAULT_CATEGORIES;
    }

    // Keep settings doc in sync if sites had new active categories
    if (stored.length > 0 && finalCategories.length !== stored.length) {
      await db.collection("settings").doc(docId(user.uid)).set(
        {
          ownerUid: user.uid,
          names: finalCategories,
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    }

    return NextResponse.json({ categories: finalCategories });
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
    const delNorms = deletes.map((d) => String(d).trim().toLowerCase()).filter(Boolean);

    for (const doc of sitesSnap.docs) {
      const current = String(doc.data().category || "");
      const currentNorm = current.trim().toLowerCase();
      let next = current;

      if (delNorms.includes(currentNorm)) {
        next = "Uncategorized";
      }
      for (const r of renames) {
        if (currentNorm === String(r.from).trim().toLowerCase()) {
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
    const finalNamesLower = new Set(finalNames.map((n) => n.toLowerCase()));

    // Get previous deleted and merge with new deletes
    const prevSnap = await db.collection("settings").doc(docId(uid)).get();
    const prevDeleted = (prevSnap.data()?.deleted as string[] | undefined) || [];
    const updatedDeleted = Array.from(
      new Set([...prevDeleted.map((d) => d.toLowerCase()), ...delNorms])
    ).filter((d) => !finalNamesLower.has(d));

    batch.set(
      db.collection("settings").doc(docId(uid)),
      {
        ownerUid: uid,
        names: finalNames,
        deleted: updatedDeleted,
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
