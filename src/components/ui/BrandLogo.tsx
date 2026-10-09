import Image from "next/image";

export const BRAND_NAME = "Fantasía Floral";

/**
 * Variantes del logo oficial (public/logo, generadas desde logo.png):
 * - logo-full.png        flor + “FANTASIA FLORAL”, fondo transparente.
 * - logo-mark.png        solo la flor, trazo original (tamaños grandes).
 * - logo-mark-small.png  solo la flor, trazo engrosado (≤ 64px).
 */
export const LOGO_FULL_SRC = "/logo/logo-full.png";
const MARK_SRC = "/logo/logo-mark.png";
const MARK_SMALL_SRC = "/logo/logo-mark-small.png";

type BrandLogoProps = {
  size?: number;
  /** `dark`: sobre fondos oscuros (login) la baldosa lleva sombra. */
  variant?: "light" | "dark";
  priority?: boolean;
  className?: string;
};

/** Isotipo de la marca en una baldosa redondeada, como el BrandLogo de CliqCut. */
export default function BrandLogo({ size = 36, variant = "light", priority = false, className = "" }: BrandLogoProps) {
  const tile = variant === "dark" ? "bg-white shadow-sm" : "bg-white ring-1 ring-gray-100";
  const inner = Math.round(size * 0.82);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl ${tile} ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={size > 64 ? MARK_SRC : MARK_SMALL_SRC}
        alt={BRAND_NAME}
        width={inner}
        height={inner}
        priority={priority}
        className="object-contain"
      />
    </span>
  );
}
