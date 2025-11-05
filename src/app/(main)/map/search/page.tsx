import SearchScreen from "./SearchScreen";

type PageProps = {
  searchParams?: { prefill?: string | string[] };
};

export default function Page({ searchParams }: PageProps) {
  const raw = searchParams?.prefill;
  const prefill = Array.isArray(raw) ? raw[0] ?? "" : raw ?? "";

  return <SearchScreen prefill={prefill} />;
}
