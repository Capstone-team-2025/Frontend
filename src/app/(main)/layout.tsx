import type { Viewport } from "next";
import TabBar from "@/components/common/TabBar";
import { AuthProvider } from "@/contexts/AuthContext";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

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