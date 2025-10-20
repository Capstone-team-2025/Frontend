import SearchScreen from "./SearchScreen";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ prefill?: string }>;
}) {
  const params = await searchParams;
  return <SearchScreen prefill={params.prefill ?? ""} />;
}