import { Suspense } from "react";
import EosClient from "./client";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense>
      <EosClient />
    </Suspense>
  );
}
