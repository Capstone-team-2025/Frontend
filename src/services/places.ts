import { getAccessToken } from "./auth";

export type Place = {
  placeId: number;
  storeId: number;
  storeName: string;
  kakaoId: string;
  placeName: string;
  latitude: number;
  longitude: number;
  addressName?: string;
  roadAddressName?: string;
  phone?: string;
  placeUrl?: string;
  distance?: number | null;
  createdAt: string;
};

export type NearbyAllResponse = {
  success: boolean;
  message: string;
  totalBrands: number;
  totalPlaces: number;
  data: Record<string, Place[]>;
};

export type NearbyByStoreResponse = {
  success: boolean;
  message: string;
  totalPlaces: number;
  data: Place[];
};

export type CategoryKey = "food" | "shop" | "culture" | "mobility" | "life" | "travel";

export type NearbyByCategoryResponse = {
  success: boolean;
  message: string;
  totalBrands: number;
  totalPlaces: number;
  data: Record<string, Place[]>;
};

type FetchOpts = {
  signal?: AbortSignal;
  timeoutMs?: number;
};

function withTimeout(signal: AbortSignal | undefined, timeoutMs: number) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(new DOMException("Timeout", "AbortError")), timeoutMs);
  if (signal) {
    signal.addEventListener(
      "abort",
      () => {
        const reason = (signal as AbortSignal & { reason?: unknown }).reason;
        if (reason !== undefined) ctrl.abort(reason);
        else ctrl.abort(new DOMException("Aborted", "AbortError"));
      },
      { once: true }
    );
  }
  return { signal: ctrl.signal, done: () => clearTimeout(timer) };
}

async function proxyGet<T>(path: string, params: Record<string, string | number>, init?: RequestInit) {
  const qs = new URLSearchParams({ path, ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) });
  const token = await getAccessToken();
  const res = await fetch(`/api/proxy?${qs.toString()}`, {
    cache: "no-store",
    ...(init ?? {}),
    headers: {
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  // 개인화가 붙었는지 콘솔 디버깅용
  if (process.env.NODE_ENV !== "production") {
    console.debug("[proxy debug] auth:", res.headers.get("x-debug-proxy-auth")); // "present"|"absent"
  }

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    console.error(`[PROXY ${path}] ${res.status}`, raw);
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

// 특정 브랜드(storeId) 지점만 가져오기
export async function fetchNearbyByStore(
  storeId: number,
  lat: number,
  lng: number,
  opts: FetchOpts = {}
): Promise<NearbyByStoreResponse> {
  const { signal, done } = withTimeout(opts.signal, opts.timeoutMs ?? 10000);
  try {
    return await proxyGet<NearbyByStoreResponse>("/api/places/nearby", { storeId, lat, lng }, { signal });
  } finally {
    done();
  }
}

// 모든 브랜드 한 번에
export async function fetchNearbyAll(
  lat: number,
  lng: number,
  opts: FetchOpts = {}
): Promise<NearbyAllResponse> {
  const { signal, done } = withTimeout(opts.signal, opts.timeoutMs ?? 15000);
  try {
    return await proxyGet<NearbyAllResponse>("/api/places/nearby/all", { lat, lng }, { signal });
  } finally {
    done();
  }
}

// 카테고리별 주변 장소
export async function fetchNearbyByCategory(
  lat: number,
  lng: number,
  category: CategoryKey,
  opts: FetchOpts = {}
): Promise<NearbyByCategoryResponse> {
  const { signal, done } = withTimeout(opts.signal, opts.timeoutMs ?? 12000);
  try {
    return await proxyGet<NearbyByCategoryResponse>("/api/places/nearby/category", { lat, lng, category }, { signal });
  } finally {
    done();
  }
}

// 카테고리별 주변 장소 (flat)
export async function fetchNearbyByCategoryFlat(
  lat: number,
  lng: number,
  category: CategoryKey,
  opts: FetchOpts = {}
): Promise<{ success: boolean; message: string; totalBrands: number; totalPlaces: number; data: Place[] }> {
  const json = await fetchNearbyByCategory(lat, lng, category, opts);

  const flat: Place[] = [];
  const brandMap = json.data ?? {};

  function toStringId(v: unknown): string {
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
    return v == null ? "" : String(v);
  }

  Object.keys(brandMap).forEach((brand) => {
    const arr = brandMap[brand];
    if (Array.isArray(arr)) {
      arr.forEach((p) => {
        const kakaoId = toStringId(p.kakaoId);
        flat.push({ ...p, kakaoId });
      });
    }
  });

  return {
    success: json.success,
    message: json.message,
    totalBrands: json.totalBrands ?? Object.keys(brandMap).length,
    totalPlaces: json.totalPlaces ?? flat.length,
    data: flat,
  };
}
