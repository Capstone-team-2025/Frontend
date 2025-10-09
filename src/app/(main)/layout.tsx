import Footer from "@/components/common/Footer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
