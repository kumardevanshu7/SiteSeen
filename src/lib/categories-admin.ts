import { getAdminDb } from "@/lib/firebase-admin";

export function categoryDocId(uid: string): string {
  return `categories_${uid}`;
}

/**
 * Ensures that a category is saved in the user's categories settings document,
 * and unmarks it if it was previously in the `deleted` list.
 */
export async function ensureCategoryInSettings(
  uid: string,
  categoryName: string
): Promise<void> {
  const cat = categoryName.trim();
  if (!cat || cat.toLowerCase() === "uncategorized") return;

  try {
    const db = getAdminDb();
    const docRef = db.collection("settings").doc(categoryDocId(uid));
    const snap = await docRef.get();
    const names: string[] = (snap.data()?.names as string[] | undefined) || [];
    const deleted: string[] = (snap.data()?.deleted as string[] | undefined) || [];

    const exists = names.some((n) => n.trim().toLowerCase() === cat.toLowerCase());
    const wasDeleted = deleted.some((d) => d.trim().toLowerCase() === cat.toLowerCase());

    if (!exists || wasDeleted) {
      const updatedNames = exists ? names : [...names, cat];
      const updatedDeleted = deleted.filter(
        (d) => d.trim().toLowerCase() !== cat.toLowerCase()
      );
      await docRef.set(
        {
          ownerUid: uid,
          names: updatedNames,
          deleted: updatedDeleted,
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.error("Failed to ensure category in settings:", err);
  }
}
