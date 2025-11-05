import Header from "@/components/common/Header";
import StoreDetailClient from "./StoreDetailClient";

export const metadata = { title: "가게 상세 페이지" };

type SearchParams = {
  storeId?: string;
  name?: string;
};

export default async function StorePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const storeId = sp.storeId ? Number(sp.storeId) : undefined;
  const name = sp.name;

  return (
    <main>
      <Header title="할인지도" />
      <StoreDetailClient storeId={storeId} name={name} />
    </main>
  );
}
