export const metadata = { title: "가게 상세 페이지" };
import Header from "@/components/common/Header";
import StoreInfo from "@/components/map/store/StoreInfo";

export default function StorePage({ params }: { params: { storeId: string } }) {
  const storeIdNum = Number(params.storeId);
  return (
    <main>
      <Header title="할인지도" />
      <StoreInfo storeId={storeIdNum} />
    </main>
  );
}
