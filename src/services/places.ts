const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
if (!BASE) {
  console.warn("[places.ts] NEXT_PUBLIC_BACKEND_URL is empty.");
}

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

// 카테고리 키
export type CategoryKey =
  | "food"
  | "shop"
  | "culture"
  | "mobility"
  | "life"
  | "travel";

// 카테고리 응답(브랜드별 맵)
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
    signal.addEventListener("abort", () => ctrl.abort((signal as any).reason), { once: true });
  }
  return { signal: ctrl.signal, done: () => clearTimeout(timer) };
}

function toURL(path: string, params: Record<string, string | number | undefined>) {
  const url = new URL(path, BASE);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && `${v}` !== "") url.searchParams.set(k, String(v));
  });
  return url.toString();
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
    const url = toURL("/api/places/nearby", { storeId, lat, lng });
    const res = await fetch(url, { method: "GET", cache: "no-store", signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} /nearby`);
    return (await res.json()) as NearbyByStoreResponse;
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
    const url = toURL("/api/places/nearby/all", { lat, lng });
    const res = await fetch(url, { method: "GET", cache: "no-store", signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} /nearby/all`);
    return (await res.json()) as NearbyAllResponse;
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
    const url = toURL("/api/places/nearby/category", { lat, lng, category });
    const res = await fetch(url, { method: "GET", cache: "no-store", signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} /nearby/category`);
    const json = (await res.json()) as NearbyByCategoryResponse;
    return json;
  } finally {
    done();
  }
}

// 카테고리별 주변 장소
export async function fetchNearbyByCategoryFlat(
  lat: number,
  lng: number,
  category: CategoryKey,
  opts: FetchOpts = {}
): Promise<{ success: boolean; message: string; totalBrands: number; totalPlaces: number; data: Place[] }> {
  const json = await fetchNearbyByCategory(lat, lng, category, opts);

  const flat: Place[] = [];
  const brandMap = json.data ?? {};

  Object.keys(brandMap).forEach((brand) => {
    const arr = brandMap[brand];
    if (Array.isArray(arr)) {
      arr.forEach((p) => {
        const kakaoId = typeof p.kakaoId === "string" ? p.kakaoId : String((p as any).kakaoId);
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
