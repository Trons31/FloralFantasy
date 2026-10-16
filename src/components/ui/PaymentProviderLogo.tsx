import { RiBankCardLine } from "react-icons/ri";
import { getPaymentProvider } from "@/lib/payment-providers";

const SIZES = {
  sm: "h-9 w-[72px] px-2 py-1.5",
  md: "h-11 w-24 px-2.5 py-2",
  lg: "h-14 w-28 px-3 py-2.5",
} as const;

/**
 * Logo oficial del proveedor en una baldosa blanca (spec 014). Sin proveedor
 * reconocido muestra el icono genérico de tarjeta.
 */
export default function PaymentProviderLogo({
  provider,
  size = "md",
  className = "",
}: {
  provider?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const match = getPaymentProvider(provider);
  return (
    <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white ${SIZES[size]} ${className}`}>
      {match ? (
        <img src={match.logo} alt={match.name} className="max-h-full max-w-full object-contain" />
      ) : (
        <RiBankCardLine className="text-primary-500" size={size === "sm" ? 16 : 20} aria-hidden="true" />
      )}
    </span>
  );
}
