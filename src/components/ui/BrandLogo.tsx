import Image from "next/image";

export const BRAND_NAME = "Fantasía Floral";

type BrandLogoProps = {
  size?: number;
  /** `dark`: sobre fondos oscuros (login) lleva una baldosa blanca. */
  variant?: "light" | "dark";
  priority?: boolean;
  className?: string;
};

/** Logo de la marca en una baldosa redondeada, como el BrandLogo de CliqCut. */
export default function BrandLogo({ size = 36, variant = "light", priority = false, className = "" }: BrandLogoProps) {
  const tile = variant === "dark" ? "bg-white shadow-sm" : "bg-brand-50";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl ${tile} ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/flowers/logo.png"
        alt={BRAND_NAME}
        width={Math.round(size * 0.8)}
        height={Math.round(size * 0.8)}
        priority={priority}
        className="object-contain"
      />
    </span>
  );
}
