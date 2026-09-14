import Image from "next/image";

/**
 * Captura real de la app dentro de un marco de teléfono.
 *
 * El marco lo dibuja CSS y la imagen va con `fill`: el tamaño lo decide el
 * contenedor (`aspect-ratio` de las capturas, 736×1600), así que no hay un
 * `width`/`height` de la imagen que el CSS pueda contradecir — que es lo que
 * disparaba el warning de next/image con los logos.
 */
export function PhoneFrame({
  src,
  alt,
  sizes,
  priority = false,
  className = "",
}: {
  src: string;
  alt: string;
  /** Ancho real con el que se muestra, para que next/image no baje una captura más grande que la necesaria. */
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative aspect-[736/1600] rounded-[2.4rem] border border-white/10 bg-surface-lowest p-2 shadow-[0_40px_80px_-24px_rgba(0,0,0,0.95)] ${className}`}
    >
      <div className="relative size-full overflow-hidden rounded-[1.9rem]">
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover object-top" />
      </div>
    </div>
  );
}
