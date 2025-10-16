const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
const toUrl = (p: string) => `${BASE}${p}`;

export type Store = {
  storeId: number;
  name: string;
  category?: string;
  div2Category?: string;
  createdAt?: string;
};

export type Suggestion = string; // /suggest 는 문자열 배열

// 공통 요청
async function getJson<T>(path: string, params: Record<string, string | number> = {}) {
  const url = new URL(toUrl(path));
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  const res = await fetch(url.toString(), {
    cache: "no-store",
  });

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    console.error(`[API ${path}] ${res.status}`, raw);
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

/** 1) 상점명 자동완성(간단) – 문자열 배열 */
export async function suggestStoreNames(q: string, limit = 5): Promise<Suggestion[]> {
  if (!q.trim()) return [];
  return getJson<Suggestion[]>("/api/stores/suggest", { q, limit });
}

/** 2) 상점 정보 자동완성(상세) – 객체 배열은 data.stores 안에 있음 */
export async function autocompleteStores(q: string, limit = 10): Promise<Store[]> {
  if (!q.trim()) return [];
  const data = await getJson<{ stores: Store[]; totalCount: number; keyword?: string; category?: string }>(
    "/api/stores/autocomplete",
    { q, limit }
  );
  return Array.isArray(data.stores) ? data.stores : [];
}

/** 3) 자음 자동완성(간단) – 문자열 배열 (q=ㄱ 등) */
export async function suggestByConsonant(q: string, limit = 5): Promise<Suggestion[]> {
  if (!q.trim()) return [];
  return getJson<Suggestion[]>("/api/stores/consonants/suggest", { q, limit });
}

/** 4) 자음 자동완성(상세) – 객체 배열은 data.stores */
export async function autocompleteByConsonant(q: string, limit = 10): Promise<Store[]> {
  if (!q.trim()) return [];
  const data = await getJson<{ stores: Store[]; totalCount: number }>(
    "/api/stores/consonants",
    { q, limit }
  );
  return Array.isArray(data.stores) ? data.stores : [];
}

/** (옵션) 카테고리 검색 */
export async function searchByCategory(category: string, limit = 10): Promise<Store[]> {
  if (!category.trim()) return [];
  return getJson<Store[]>("/api/stores/category", { category, limit });
}

/** (옵션) 2차 카테고리 검색 */
export async function searchByDiv2Category(div2Category: string, limit = 10): Promise<Store[]> {
  if (!div2Category.trim()) return [];
  return getJson<Store[]>("/api/stores/div2-category", { div2Category, limit });
}

/** (UI 편의) 사용자가 입력한 q가 '한글 자음(ㄱ-ㅎ) 1글자'인지 체크 */
export function isHangulConsonantOneChar(q: string) {
  return /^[ㄱ-ㅎ]$/.test(q.trim());
}
