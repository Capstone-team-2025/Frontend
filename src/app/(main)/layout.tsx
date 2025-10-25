import TabBar from "@/components/common/TabBar";
import { AuthProvider } from "@/contexts/AuthContext";
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-dvh">
        {children}
        <TabBar />
      </div>
    </AuthProvider>
  );
}
