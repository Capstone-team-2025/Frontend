import Header from "@/components/common/Header";

export default function MyPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
