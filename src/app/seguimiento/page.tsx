import { Suspense } from "react";
import SeguimientoPageClient from "@/components/client/SeguimientoPageClient";

export default function SeguimientoPage() {
  return (
    <Suspense fallback={null}>
      <SeguimientoPageClient />
    </Suspense>
  );
}
