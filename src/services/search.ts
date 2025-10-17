const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
const toUrl = (p: string) => `${BASE}${p}`;

export type Store = {
  storeId: number;
  name: string;
  category?: string;
  div2Category?: string;
  createdAt?: string;
};

export type Suggestion = string;

export const FIRST_CATEGORIES = [
  "식음료", "쇼핑/소매", "문화/엔터테인먼트", "모빌리티", "라이프", "여행",
] as const;
export const FIRST_SET = new Set<string>(FIRST_CATEGORIES);

// 1차 별칭: 정확 매칭만 하려면 비워도 됨
export const FIRST_ALIAS: Record<string, string> = {
  "쇼핑": "쇼핑/소매",
  "소매": "쇼핑/소매",
  "문화": "문화/엔터테인먼트",
  "여가": "문화/엔터테인먼트",
  "엔터테인먼트": "문화/엔터테인먼트",
};

export const SECOND_CATEGORIES = [
  // 식음료
  "카페/음료", "식당", "베이커리", "치킨/패스트푸드",
  // 쇼핑/소매
  "쇼핑", "의류", "가전/전자", "기프티콘/쿠폰", "뷰티", "편의점",
  // 문화/엔터테인먼트
  "테마파크/문화시설", "영화", "음악", "OTT/스트리밍", "사진", "골프", "도서",
  // 모빌리티
  "렌터카/카셰어링", "교통/자동차",
  // 라이프
  "생활", "건강", "육아", "교육", "반려동물", "결혼/웨딩", "금융/보험", "통신사",
  // 여행
  "여행/항공", "숙박/호텔", "공항/라운지",
  // 기타
  "기타",
] as const;
export const SECOND_SET = new Set<string>(SECOND_CATEGORIES);

type CategoryResolution =
  | { kind: "first"; value: string }
  | { kind: "second"; value: string }
  | { kind: "none" };

function resolveCategory(query: string): CategoryResolution {
  const q = query.trim();
  if (!q) return { kind: "none" };
  if (FIRST_SET.has(q)) return { kind: "first", value: q };
  if (SECOND_SET.has(q)) return { kind: "second", value: q };
  return { kind: "none" };
}

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

// 프록시 경유 공통 요청 (프론트 쿠키 auth_token → 백엔드 Authorization 헤더로 전달)
async function getJsonViaProxy<T>(path: string, params: Record<string, string | number> = {}) {
  const qs = new URLSearchParams({ path, ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) });
  const res = await fetch(`/api/proxy?${qs.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    console.error(`[PROXY ${path}] ${res.status}`, raw);
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}


// 상점명 자동완성(간단) – 검색창에서 상점명 일부가 그대로 일치하는 경우 자동완성에 사용
export async function suggestStoreNames(q: string, limit = 5): Promise<Suggestion[]> {
  if (!q.trim()) return [];
  return getJson<Suggestion[]>("/api/stores/suggest", { q, limit });
}

// 상점 정보 자동완성(상세) – 검색결과창에 상점명 일부가 그대로 일치하는 경우 검색 결과를 보여주는것에 사용
export async function autocompleteStores(q: string, limit = 10): Promise<Store[]> {
  if (!q.trim()) return [];
  const data = await getJson<{ stores: Store[]; totalCount: number; keyword?: string; category?: string }>(
    "/api/stores/autocomplete",
    { q, limit }
  );
  return Array.isArray(data.stores) ? data.stores : [];
}

// 자음 자동완성(간단) – 자음만으로도 일차하는 결과를 검색창 자동완성에 보여주는것에 사용
export async function suggestByConsonant(q: string, limit = 5): Promise<Suggestion[]> {
  if (!q.trim()) return [];
  return getJson<Suggestion[]>("/api/stores/consonants/suggest", { q, limit });
}

// 자음 자동완성(상세) – 자음만으로도 일차하는 결과를 검색결과 창에 보여주는것에 사용
export async function autocompleteByConsonant(q: string, limit = 10): Promise<Store[]> {
  if (!q.trim()) return [];
  const data = await getJson<{ stores: Store[]; totalCount: number }>(
    "/api/stores/consonants",
    { q, limit }
  );
  return Array.isArray(data.stores) ? data.stores : [];
}

// 1차 카테고리 검색
export async function searchByCategory(category: string, limit = 10): Promise<Store[]> {
  if (!category.trim()) return [];
  const res = await getJsonViaProxy<Store[] | { stores: Store[]; totalCount?: number }>(
    "/api/stores/category",
    { category, limit }
  );
  return Array.isArray(res) ? res : (res?.stores ?? []);
}

// 2차 카테고리 검색
export async function searchByDiv2Category(div2Category: string, limit = 10): Promise<Store[]> {
  if (!div2Category.trim()) return [];
  const res = await getJsonViaProxy<Store[] | { stores: Store[]; totalCount?: number }>(
    "/api/stores/div2-category",
    { div2Category, limit }
  );
  return Array.isArray(res) ? res : (res?.stores ?? []);
}

// 최근 상점 가져오기
export async function fetchRecentStores(limit = 10): Promise<Store[]> {
  const res = await getJson<Store[] | { stores: Store[] }>(
    "/api/stores/recent",
    { limit }
  );
  return Array.isArray(res) ? res : (res?.stores ?? []);
}

// (UI 편의) 사용자가 입력한 q가 '한글 자음(ㄱ-ㅎ) 1글자'인지 체크
export function isHangulConsonantOneChar(q: string) {
  return /^[ㄱ-ㅎ]$/.test(q.trim());
}

// 입력 하나로 상점명/자음/카테고리(1차/2차)를 통합 처리
export async function unifiedSearch(q: string, limit = 10) {
  const query = q.trim();
  if (!query) return [];

  // 자음 1글자 처리
  if (isHangulConsonantOneChar(query)) {
    return autocompleteByConsonant(query, limit);
  }

  const cat = resolveCategory(query);
  switch (cat.kind) {
    case "first":
      return searchByCategory(cat.value, limit);
    case "second":
      return searchByDiv2Category(cat.value, limit);
    case "none":
    default:
      return autocompleteStores(query, limit);
  }
}
