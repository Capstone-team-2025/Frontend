import MapContainer from "./MapContainer";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const get = (k: string) => {
    const v = sp?.[k];
    return Array.isArray(v) ? v[0] : v ?? "";
  };

  const keyword = get("keyword");
  const categoryFirst = get("cat");
  const openSheet = get("sheet") === "store";
  const displayName = get("name") || keyword;

  const storeIdStr = get("storeId");
  const storeId = storeIdStr ? Number(storeIdStr) : undefined;

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden">
      <MapContainer
        initialKeyword={keyword}
        initialCategory={categoryFirst}
        initialSheetOpen={openSheet}
        initialName={displayName}
        initialStoreId={storeId}
      />
    </main>
  );
}
