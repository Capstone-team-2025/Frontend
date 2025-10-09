import { Suspense } from "react";
import CompleteClient from "./CompleteClient";

export const dynamic = "force-dynamic";

export default async function CompletePage() {
  return (
    <Suspense fallback={null}>
      <CompleteClient />
    </Suspense>
  );
}
