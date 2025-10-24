"use client";

export type UserInfoProps = { grade: string; condensed?: boolean };

export default function UserInfo({ grade, condensed = false }: UserInfoProps) {
  const g =
    grade && ["화이트", "일반", "실버", "골드", "다이아몬드"].includes(grade)
      ? grade
      : (grade || "").toUpperCase();

  return (
    <div className="px-5 mb-4">
      <p className={condensed ? "text-sm" : "text-[15px]"}>
        <span>회원님은 </span>
        <span className="font-bold">{g || "—"}</span> 등급입니다.
      </p>
    </div>
  );
}
