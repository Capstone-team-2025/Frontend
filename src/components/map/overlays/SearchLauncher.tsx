"use client";
import { useRouter } from "next/navigation";
import SearchInput from "./SearchInput";

export default function SearchLauncher() {
  const router = useRouter();
  return (
    <div className="w-full mx-auto max-w-[425px]">
      <SearchInput
        placeholder="여기서 검색"
        onSearch={(q: string) => router.push(`/map/search?prefill=${encodeURIComponent(q)}`)}
        onChangeDebounced={undefined}
        onFocus={() => router.push("/map/search")}
        className="pointer-events-auto"
        iconSrc="/images/Search.png"
      />
    </div>
  );
}