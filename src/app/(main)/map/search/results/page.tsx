import SearchResultsScreen from "./SearchResultsScreen";

type PageProps = {
  searchParams?: { q?: string | string[] };
};

export default function Page({ searchParams }: PageProps) {
  const qParam = Array.isArray(searchParams?.q)
    ? searchParams?.q[0] ?? ""
    : searchParams?.q ?? "";

  return <SearchResultsScreen q={qParam} />;
}
