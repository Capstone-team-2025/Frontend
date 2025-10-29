export type FavoriteItem = {
  favoriteId: number;
  userId: number;
  placeId: number;
  placeName: string;
  createdAt: string;
};

const PROXY = "/api/proxy";

export async function fetchFavorites(): Promise<FavoriteItem[]> {
  const res = await fetch(`${PROXY}?path=/api/favorites`, {
    method: "GET",
  });
  if (!res.ok) throw new Error(`즐겨찾기 조회 실패: ${res.status}`);
  const json = await res.json();
  return json.data as FavoriteItem[];
}

export async function addFavorite(placeId: number, placeName: string): Promise<FavoriteItem> {
  const res = await fetch(`${PROXY}?path=/api/favorites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ placeId, placeName }),
  });

  if (res.status === 409) {
    throw new Error("DUPLICATED_FAVORITE");
  }
  if (!res.ok) throw new Error(`즐겨찾기 추가 실패: ${res.status}`);

  const json = await res.json();
  return json.data as FavoriteItem;
}

export async function removeFavorite(placeId: number) {
  const res = await fetch(`${PROXY}?path=/api/favorites/${placeId}`, {
    method: "DELETE",
  });
  if (res.status === 404) return { notFound: true };
  if (!res.ok) throw new Error(`즐겨찾기 삭제 실패: ${res.status}`);
  return true;
}
