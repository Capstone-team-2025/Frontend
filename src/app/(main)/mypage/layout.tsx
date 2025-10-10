export default function MyPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="p-5">{children}</main>;
}
