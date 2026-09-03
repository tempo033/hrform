import { Suspense } from "react";
import EmployeesClient from "./client";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense>
      <EmployeesClient />
    </Suspense>
  );
}
