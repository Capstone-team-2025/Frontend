import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MAPNEFIT",
  description: "Mapnefit App",
};

export default function RootLayout({ children,}: { children: React.ReactNode;}) 
{
  return (
    <html lang="ko">
      <body className="min-h-screen bg-white">{children}</body>
    </html>
  );
}
