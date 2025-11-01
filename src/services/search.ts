import { getAccessToken } from "./auth";

export type Store = {
  storeId: number;
  name: string;
  category?: string;
  div2Category?: string;
  createdAt?: string;
};

export type Suggestion = string;

export type AutoCompleteResponse = {
  keyword: string;
  stores: Store[];
  totalCount: number;
  category?: string;
  matchedCategories?: string[];
  matchedDiv2Categories?: string[];
  limit?: number;
};

export const FIRST_CATEGORIES = [
  "식음료", "쇼핑/소매", "문화/엔터테인먼트", "모빌리티", "라이프", "여행",
] as const;
export const FIRST_SET = new Set<string>(FIRST_CATEGORIES);

export const SECOND_CATEGORIES = [
  "카페/음료", "식당", "베이커리", "치킨/패스트푸드",
  "쇼핑", "의류", "가전/전자", "기프티콘/쿠폰", "뷰티", "편의점",
  "테마파크/문화시설", "영화", "음악", "OTT/스트리밍", "사진", "골프", "도서",
  "렌터카/카셰어링", "교통/자동차",
  "생활", "건강", "육아", "교육", "반려동물", "결혼/웨딩", "금융/보험", "통신사",
  "여행/항공", "숙박/호텔", "공항/라운지",
  "기타",
] as const;
export const SECOND_SET = new Set<string>(SECOND_CATEGORIES);

// ------------------------------- 내부 유틸 -------------------------------
function nonEmpty(v: unknown): string | undefined {
  if (typeof v === "string") {
    const t = v.trim();
    return t ? t : undefined;
  }
  if (typeof v === "number" || typeof v === "boolean") {
    return String(v);
  }
  return undefined;
}

type QueryParams = Record<string, string | number | boolean | undefined | null>;

function buildParams(params: QueryParams = {}): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    const nv = nonEmpty(v);
    if (nv !== undefined) out[k] = nv;
  }
  return out;
}

async function getJson<T>(path: string, params: QueryParams = {}): Promise<T> {
  const qs = new URLSearchParams({
    path,
    ...buildParams(params),
  });

  const token = getAccessToken();
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`/api/proxy?${qs.toString()}`, {
    cache: "no-store",
    headers,
  });

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    console.error(`[PROXY ${path}] ${res.status}`, raw);
    throw new Error(`HTTP ${res.status}`);
  }

  try {
    return (await res.json()) as T;
  } catch {
    throw new Error("Invalid JSON response");
  }
}

// ------------------------------- 공개 검색 API들 -------------------------------
export async function suggestStoreNames(q: string, limit = 5): Promise<Suggestion[]> {
  if (!q.trim()) return [];
  return getJson<Suggestion[]>("/api/stores/suggest", { q, limit });
}

export async function autocompleteStores(q: string, limit = 10): Promise<Store[]> {
  if (!q.trim()) return [];
  const data = await getJson<{ stores: Store[]; totalCount: number; keyword?: string; category?: string }>(
    "/api/stores/autocomplete",
    { q, limit }
  );
  return Array.isArray(data.stores) ? data.stores : [];
}

export async function suggestByConsonant(q: string, limit = 5): Promise<Suggestion[]> {
  if (!q.trim()) return [];
  return getJson<Suggestion[]>("/api/stores/consonants/suggest", { q, limit });
}

export async function autocompleteByConsonant(q: string, limit = 10): Promise<Store[]> {
  if (!q.trim()) return [];
  const data = await getJson<{ stores: Store[]; totalCount: number }>(
    "/api/stores/consonants",
    { q, limit }
  );
  return Array.isArray(data.stores) ? data.stores : [];
}

export async function searchByCategory(category: string, limit = 10): Promise<Store[]> {
  if (!category.trim()) return [];
  const data = await getJson<{ stores: Store[]; totalCount?: number }>(
    "/api/stores/category",
    { category, limit }
  );
  return Array.isArray(data.stores) ? data.stores : [];
}

export async function searchByDiv2Category(div2Category: string, limit = 10): Promise<Store[]> {
  if (!div2Category.trim()) return [];
  const data = await getJson<{ stores: Store[]; totalCount?: number }>(
    "/api/stores/div2-category",
    { div2Category, limit }
  );
  return Array.isArray(data.stores) ? data.stores : [];
}

export async function searchByCategoryKeyword(keyword: string, limit = 10): Promise<Store[]> {
  if (!keyword.trim()) return [];
  const data = await getJson<AutoCompleteResponse>("/api/stores/category/search", { keyword, limit });
  return Array.isArray(data.stores) ? data.stores : [];
}

export async function searchByDiv2CategoryKeyword(keyword: string, limit = 10): Promise<Store[]> {
  if (!keyword.trim()) return [];
  const data = await getJson<AutoCompleteResponse>("/api/stores/div2-category/search", { keyword, limit });
  return Array.isArray(data.stores) ? data.stores : [];
}

export async function searchByCategoryCombined(category: string, div2Category: string, limit = 10): Promise<Store[]> {
  if (!category.trim() || !div2Category.trim()) return [];
  const data = await getJson<AutoCompleteResponse>(
    "/api/stores/category/combined-search",
    { category, div2Category, limit }
  );
  return Array.isArray(data.stores) ? data.stores : [];
}

export async function fetchRecentStores(limit = 10): Promise<Store[]> {
  const res = await getJson<Store[] | { stores: Store } | { stores: Store[] }>(
    "/api/stores/recent",
    { limit }
  );
  if (Array.isArray(res)) return res;
  if (res && typeof res === "object") {
    const maybe = (res as { stores?: unknown }).stores;
    return Array.isArray(maybe) ? maybe : [];
  }
  return [];
}

export function isHangulConsonantOneChar(q: string): boolean {
  return /^[ㄱ-ㅎ]$/.test(q.trim());
}

export async function unifiedSearch(q: string, limit = 10): Promise<Store[]> {
  const raw = q.trim();
  if (!raw) return [];
  if (isHangulConsonantOneChar(raw)) return autocompleteByConsonant(raw, limit);

  const normalized = raw;
  const firstMatch = FIRST_SET.has(normalized);
  const secondMatch = SECOND_SET.has(normalized);

  if (firstMatch) {
    const exactFirst = await searchByCategory(normalized, limit);
    if (exactFirst.length > 0) return exactFirst;
  }
  if (secondMatch) {
    const exactSecond = await searchByDiv2Category(normalized, limit);
    if (exactSecond.length > 0) return exactSecond;
  }

  const byDiv2 = await searchByDiv2CategoryKeyword(normalized, limit);
  if (byDiv2.length > 0) return byDiv2;

  const byFirst = await searchByCategoryKeyword(normalized, limit);
  if (byFirst.length > 0) return byFirst;

  const tokens = normalized.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) {
    const [c1, c2] = tokens;
    const combo = await searchByCategoryCombined(c1, c2, limit);
    if (combo.length > 0) return combo;
  }

  return autocompleteStores(normalized, limit);
}
