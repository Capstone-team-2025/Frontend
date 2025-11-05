"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchStoreBenefits, type StoreBenefit, LEVEL_DISPLAY_NAME } from "@/services/benefits";

type Props = {
  storeId?: number;
  name?: string;
};

export default function StoreDetailClient({ storeId, name }: Props) {
  const [benefits, setBenefits] = useState<StoreBenefit[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resolvedStoreId = useMemo(() => {
    return typeof storeId === "number" && !Number.isNaN(storeId) ? storeId : null;
  }, [storeId]);

  useEffect(() => {
    let alive = true;

    async function run() {
      if (resolvedStoreId == null) {
        setBenefits([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setErrorMsg(null);
        const data = await fetchStoreBenefits(resolvedStoreId);
        if (!alive) return;
        setBenefits(data);
      } catch (err) {
        if (!alive) return;
        setErrorMsg(err instanceof Error ? err.message : "알 수 없는 오류");
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [resolvedStoreId]);

  return (
    <section className="px-4 py-3">
      <h2 className="text-lg font-semibold">{name ?? "매장 상세"}</h2>
      <hr className="my-3 border-t border-[#B7B7B7]" />
      {loading && <div className="mt-3 text-sm text-gray-500">혜택 불러오는 중…</div>}

      {!loading && errorMsg && (
        <div className="mt-3 text-sm text-red-600">혜택 조회 실패: {errorMsg}</div>
      )}

      {!loading && !errorMsg && benefits && benefits.length === 0 && (
        <div className="mt-3 text-sm text-gray-500">등록된 혜택이 없습니다.</div>
      )}

      {!loading && !errorMsg && benefits && benefits.length > 0 && (
        <ul className="mt-3 space-y-3">
          {benefits.map((b) => (
            <li key={b.benefitId} className="rounded-xl">
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                {b.benefitContent}
              </p>
              {b.usageLimit && (
                <p className="mt-2 text-xs text-gray-600">이용 한도: {b.usageLimit}</p>
              )}
              {b.usageCondition && (
                <p className="mt-1 whitespace-pre-wrap text-xs text-gray-600">
                  이용 조건: {b.usageCondition}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
