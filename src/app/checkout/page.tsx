import { Suspense } from "react";
import CheckoutPageClient from "@/components/client/CheckoutPageClient";

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutPageClient />
    </Suspense>
  );
}
