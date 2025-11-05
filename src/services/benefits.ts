import { getAccessToken } from "./auth";

export type MembershipCarrier = "SK" | "KT" | "LG";

export const SK_LEVELS = ["VIP", "GOLD", "SILVER"] as const;
export const KT_LEVELS = ["VVIP", "KT_VIP", "KT_GOLD", "KT_SILVER", "WHITE", "BASIC"] as const;
export const LG_LEVELS = ["LG_VVIP", "LG_VIP", "DIAMOND"] as const;

export type SkLevel = (typeof SK_LEVELS)[number];
export type KtLevel = (typeof KT_LEVELS)[number];
export type LgLevel = (typeof LG_LEVELS)[number];
export type MembershipLevelId = SkLevel | KtLevel | LgLevel;

export const LEVEL_DISPLAY_NAME: Record<MembershipLevelId, string> = {
  // SKT
  VIP: "VIP",
  GOLD: "GOLD",
  SILVER: "SILVER",
  // KT
  VVIP: "VVIP",
  KT_VIP: "VIP",
  KT_GOLD: "골드",
  KT_SILVER: "실버",
  WHITE: "화이트",
  BASIC: "일반",
  // LG U+
  LG_VVIP: "VVIP",
  LG_VIP: "VIP",
  DIAMOND: "다이아몬드",
};

export type StoreBenefit = {
  benefitId: number;
  storeId: number;
  membershipCarrier: MembershipCarrier;
  membershipLevel: MembershipLevelId;
  benefitContent: string;
  usageLimit: string;
  usageCondition: string;
};

const PROXY = "/api/proxy";

export async function fetchStoreBenefits(storeId: number): Promise<StoreBenefit[]> {
  const token = await getAccessToken();

  const url = new URL(PROXY, window.location.origin);
  url.searchParams.set("path", `/api/benefits/store/${storeId}/me`);

  const headers: Record<string, string> = {};
  if (token && token !== "undefined" && token !== "null") {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (res.status === 401) throw new Error("로그인이 필요합니다. (401)");
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`혜택 조회 실패: ${res.status}`);

  const data: StoreBenefit[] = await res.json();
  return data;
}
