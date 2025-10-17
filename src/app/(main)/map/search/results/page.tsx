import SearchResultsScreen from "@/components/search/SearchResultsScreen";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  return <SearchResultsScreen q={params.q ?? ""} />;
}