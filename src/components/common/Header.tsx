"use client";

export default function Header({ title }: { title: string }) {
  return (
    <header className="my-3 sticky px-4 py-3">
      <h1 className="flex justify-center font-bold text-xl ">{title}</h1>
    </header>
  );
}
