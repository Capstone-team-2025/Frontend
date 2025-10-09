//(auth) 그룹 공통 레이아웃
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-dvh bg-white">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="w-full text-center">{children} </div>
        </div>
      </div>
    </main>
  );
}
