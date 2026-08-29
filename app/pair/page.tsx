import { Suspense } from "react";

import PairPageClient from "./pair-client";

export default function PairPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center p-6 text-sm text-zinc-500">
          Loading pairing…
        </main>
      }
    >
      <PairPageClient />
    </Suspense>
  );
}
