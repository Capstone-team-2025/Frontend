export function getAccessToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const v =
      window.localStorage.getItem("auth_token") ??
      window.localStorage.getItem("accessToken");
    return v?.trim() || undefined;
  } catch {}
  return undefined;
}
