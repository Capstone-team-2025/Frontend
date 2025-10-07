import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MAPNEFIT",
  description: "Mapnefit App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="bg-neutral-100">
      <body >
        <div className="mx-auto w-full max-w-[425px] min-h-dvh bg-white shadow-sm">
          {children}
        </div>
      </body>
    </html>
  );
}
