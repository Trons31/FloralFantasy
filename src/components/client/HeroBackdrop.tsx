import Image from "next/image";
import { canOptimizeImage } from "@/lib/image";

type HeroPhoto = { src: string; alt: string };

type HeroBackdropProps = {
  /** Foto del fondo. Se muestra desenfocada: su resolución da igual. */
  background: string;
  /** Fotos nítidas para el collage de la derecha (1 a 3), solo en `lg+`. */
  photos?: HeroPhoto[];
  /** Clases del contenedor interior (padding, alto mínimo). */
  className?: string;
  children: React.ReactNode;
};

function Photo({ src, alt, sizes, priority = false }: HeroPhoto & { sizes: string; priority?: boolean }) {
  return canOptimizeImage(src) ? (
    <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
  );
}

const card = "relative overflow-hidden rounded-3xl bg-white/10 ring-1 ring-white/15 shadow-[0_24px_60px_rgba(0,0,0,.35)]";

/**
 * Banner de la tienda con foto (spec 009). Las fotos de producto son verticales
 * y pequeñas (≈960×1280); estiradas a todo el ancho se pixelaban. Aquí el
 * fondo es la foto muy desenfocada (conserva color y ambiente) y la foto
 * nítida va a la derecha a su tamaño real.
 */
export default function HeroBackdrop({ background, photos = [], className = "", children }: HeroBackdropProps) {
  const [main, ...rest] = photos.slice(0, 3);

  return (
    <section className="relative isolate overflow-hidden bg-[#140b12]">
      <div className="absolute inset-0 -z-10" aria-hidden>
        {canOptimizeImage(background) ? (
          // Se pide pequeña a propósito: desenfocada no se nota y pesa mucho menos.
          <Image src={background} alt="" fill sizes="480px" priority className="scale-125 object-cover opacity-80 blur-2xl" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={background} alt="" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-80 blur-2xl" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0811]/90 via-[#0d0811]/70 to-[#0d0811]/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
      </div>

      <div className={`relative mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] ${className}`}>
        <div className="min-w-0">{children}</div>

        {main && (
          <div className="hidden lg:block" aria-hidden>
            {rest.length === 0 ? (
              <div className={`${card} h-[320px] w-[240px] rotate-2`}>
                <Photo {...main} sizes="240px" priority />
              </div>
            ) : (
              <div className="grid grid-cols-[150px_220px] gap-3">
                <div className="grid gap-3">
                  {rest.map(photo => (
                    <div key={photo.src} className={`${card} h-[150px] w-[150px]`}>
                      <Photo {...photo} sizes="150px" />
                    </div>
                  ))}
                </div>
                <div className={`${card} h-[312px] w-[220px] ${rest.length === 1 ? "self-center" : ""}`}>
                  <Photo {...main} sizes="220px" priority />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
