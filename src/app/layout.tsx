import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "MAPNEFIT",
  description: "Mapnefit App",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1, 
    userScalable: false, 
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="bg-neutral-100">
      <body>
        <AuthProvider>
          <div className="mx-auto w-full max-w-[425px] min-h-dvh bg-white shadow-sm">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
