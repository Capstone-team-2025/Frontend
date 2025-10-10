export const metadata = { title: "지도페이지" };
import KakaoMap from "@/components/map/KakaoMap";

export default function MapPage() {
  return (
    <main className="h-[100dvh]">
      <KakaoMap height="100%" />
    </main>
  );
}