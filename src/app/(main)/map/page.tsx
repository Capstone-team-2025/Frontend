import MapContainer from "./MapContainer";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function Page({ searchParams }: PageProps) {
  const sp = searchParams ?? {};

  const get = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v ?? "";
  };

  const keyword = get("keyword");
  const categoryFirst = get("cat");
  const openSheet = get("sheet") === "store";
  const displayName = get("name") || keyword;

  const storeIdStr = get("storeId");
  const storeId =
    storeIdStr !== "" && Number.isFinite(Number(storeIdStr))
      ? Number(storeIdStr)
      : undefined;

  return (
    <main className="relative h-dvh w-full overflow-hidden">
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
