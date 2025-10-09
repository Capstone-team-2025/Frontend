import { Suspense } from "react";
import CompleteClient from "./CompleteClient";

export default async function CompletePage() {
  return (
    <Suspense fallback={null}>
      <CompleteClient />
    </Suspense>
  );
}
