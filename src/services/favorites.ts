import { getAccessToken } from "./auth";

export type FavoriteItem = {
  favoriteId: number;
  userId: number;
  placeId: number;
  placeName: string;
  createdAt: string;
};

const PROXY = "/api/proxy";

function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = getAccessToken();
  return {
    ...(extra ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function safeGet<T>(obj: Record<string, unknown>, key: string): T | undefined {
  const v = obj[key];
  return v as T | undefined;
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return undefined;
  }
}

function unwrapArray<T>(json: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(json)) return json as T[];
  if (isObject(json)) {
    const data = safeGet<unknown>(json, "data");
    if (Array.isArray(data)) return data as T[];
  }
  return fallback;
}

function unwrapObject<T>(json: unknown): T | undefined {
  if (isObject(json)) {
    const data = safeGet<unknown>(json, "data");
    if (isObject(data)) return data as T;

    return json as T;
  }
  return undefined;
}

export async function fetchFavorites(): Promise<FavoriteItem[]> {
  const res = await fetch(`${PROXY}?path=/api/favorites`, {
    method: "GET",
    cache: "no-store",
    headers: authHeaders(),
  });

  if (res.status === 404) {
    console.warn("[favorites] GET 404 → return []");
    return [];
  }

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    console.error("[favorites] GET", res.status, raw);
    throw new Error(`즐겨찾기 조회 실패: ${res.status}`);
  }

  const json = await safeJson(res);
  return unwrapArray<FavoriteItem>(json, []);
}

export async function addFavorite(
  placeId: number,
  placeName: string
): Promise<FavoriteItem> {
  const res = await fetch(`${PROXY}?path=/api/favorites`, {
    method: "POST",
    headers: authHeaders({ "content-type": "application/json" }),
    body: JSON.stringify({ placeId, placeName }),
    cache: "no-store",
  });

  if (res.status === 404) {
    console.warn("[favorites] POST 404 → fake item");
    return {
      favoriteId: -1,
      userId: -1,
      placeId,
      placeName,
      createdAt: new Date().toISOString(),
    };
  }

  if (res.status === 409) {
    throw new Error("DUPLICATED_FAVORITE");
  }

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    console.error("[favorites] POST", res.status, raw);
    throw new Error(`즐겨찾기 추가 실패: ${res.status}`);
  }

  const json = await safeJson(res);
  const item = unwrapObject<FavoriteItem>(json);
  if (!item) {
    const raw = await res.text().catch(() => "");
    console.error("[favorites] POST invalid payload", raw);
    throw new Error("즐겨찾기 추가 실패: invalid payload");
  }
  return item;
}

export async function removeFavorite(placeId: number): Promise<void> {
  const res = await fetch(`${PROXY}?path=/api/favorites/${placeId}`, {
    method: "DELETE",
    cache: "no-store",
    headers: authHeaders(),
  });

  if (res.status === 404) {
    console.warn("[favorites] DELETE 404 → ignore");
    return;
  }

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    console.error("[favorites] DELETE", res.status, raw);
    throw new Error(`즐겨찾기 삭제 실패: ${res.status}`);
  }
}
