export interface SavedSite {
  id: string;
  url: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  imageUrl?: string;
  favicon?: string;
  createdAt: number;
  ownerUid?: string;
  lastOpenedAt?: number;
  visitCount?: number;
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function authHeaders(
  googleToken?: string | null,
  unlockToken?: string | null,
  withJson = false
): HeadersInit {
  const headers: Record<string, string> = {};
  if (withJson) headers["Content-Type"] = "application/json";
  if (googleToken) headers.Authorization = `Bearer ${googleToken}`;
  if (unlockToken) headers["X-One-Password-Unlock"] = unlockToken;
  return headers;
}

async function throwIfBad(res: Response) {
  if (res.ok) return;
  const err = await res.json().catch(() => ({}));
  throw new ApiError(err.error || "Request failed", res.status, err.code);
}

/** All reads/writes go to Firestore via API — no localStorage. */
export async function getSites(
  googleToken?: string | null
): Promise<SavedSite[]> {
  const res = await fetch("/api/sites", {
    cache: "no-store",
    headers: authHeaders(googleToken),
  });
  await throwIfBad(res);
  const data = await res.json();
  return (data.sites as SavedSite[]) || [];
}

export async function getSiteById(
  id: string,
  googleToken?: string | null
): Promise<SavedSite | null> {
  const res = await fetch(`/api/sites/${id}`, {
    cache: "no-store",
    headers: authHeaders(googleToken),
  });
  if (res.status === 404) return null;
  await throwIfBad(res);
  const data = await res.json();
  return data.site as SavedSite;
}

export async function addSite(
  siteData: Omit<SavedSite, "id" | "createdAt">,
  googleToken?: string | null,
  unlockToken?: string | null
): Promise<SavedSite> {
  const res = await fetch("/api/sites", {
    method: "POST",
    headers: authHeaders(googleToken, unlockToken, true),
    body: JSON.stringify(siteData),
  });
  await throwIfBad(res);
  const data = await res.json();
  return data.site as SavedSite;
}

export async function deleteSite(
  id: string,
  googleToken?: string | null,
  unlockToken?: string | null
): Promise<void> {
  const res = await fetch(`/api/sites/${id}`, {
    method: "DELETE",
    headers: authHeaders(googleToken, unlockToken),
  });
  await throwIfBad(res);
}

export async function updateSite(
  id: string,
  updates: Partial<Omit<SavedSite, "id" | "createdAt">>,
  googleToken?: string | null,
  unlockToken?: string | null
): Promise<void> {
  const res = await fetch(`/api/sites/${id}`, {
    method: "PATCH",
    headers: authHeaders(googleToken, unlockToken, true),
    body: JSON.stringify(updates),
  });
  await throwIfBad(res);
}

/** Record site open/visit without requiring One Password (protected by Google Auth) */
export async function recordSiteVisit(
  id: string,
  googleToken?: string | null
): Promise<{ ok: boolean; lastOpenedAt: number; visitCount: number } | null> {
  try {
    const res = await fetch(`/api/sites/${id}`, {
      method: "POST",
      headers: authHeaders(googleToken),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getCategories(
  googleToken?: string | null
): Promise<string[]> {
  const res = await fetch("/api/categories", {
    cache: "no-store",
    headers: authHeaders(googleToken),
  });
  await throwIfBad(res);
  const data = await res.json();
  return (data.categories as string[]) || [];
}

export async function saveCategories(
  payload: {
    names: string[];
    renames?: { from: string; to: string }[];
    deletes?: string[];
  },
  googleToken?: string | null,
  unlockToken?: string | null
): Promise<string[]> {
  const res = await fetch("/api/categories", {
    method: "PUT",
    headers: authHeaders(googleToken, unlockToken, true),
    body: JSON.stringify(payload),
  });
  await throwIfBad(res);
  const data = await res.json();
  return (data.categories as string[]) || [];
}
