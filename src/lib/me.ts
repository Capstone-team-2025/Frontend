export type MeUser = {
  level?: string;
  levelDisplayName?: string;
};

type AnyObj = Record<string, unknown>;

function isObj(v: unknown): v is AnyObj {
  return typeof v === "object" && v !== null;
}

function looksLikeUser(v: unknown): v is MeUser {
  if (!isObj(v)) return false;
  const lv = v["level"];
  const ld = v["levelDisplayName"];
  return typeof lv === "string" || typeof ld === "string";
}

export function extractUserFromMe(data: unknown): MeUser | undefined {
  if (!isObj(data)) return undefined;

  const u1 =
    isObj(data.user) && isObj((data.user as AnyObj).user)
      ? (data.user as AnyObj).user
      : undefined;

  const u2 = isObj(data.user) ? data.user : undefined;
  const u3 = data;

  const candidate = u1 ?? u2 ?? u3;
  return looksLikeUser(candidate) ? (candidate as MeUser) : undefined;
}

export function extractGrade(u: MeUser | undefined): string {
  if (!u) return "";
  const display = u.levelDisplayName;
  const code =
    typeof u.level === "string"
      ? (u.level.split("_").pop() ?? "").toUpperCase()
      : "";
  return display ?? code ?? "";
}
