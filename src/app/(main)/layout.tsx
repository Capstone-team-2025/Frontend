import TabBar from "@/components/common/TabBar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      {children}
      <TabBar />
    </div>
  );
}