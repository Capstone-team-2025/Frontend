import type { Metadata } from "next";
import FavoritesView from "./FavoritesClient";

export const metadata: Metadata = {
  title: "즐겨찾기한 매장",
};

export default function Page() {
  return <FavoritesView />;
}
