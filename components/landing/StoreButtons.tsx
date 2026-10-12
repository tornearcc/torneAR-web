import Image from "next/image";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/store-links";

/*
 * Botones de tienda de la zona pública (landing e invitaciones).
 *
 * ─── App Store: badge OFICIAL, no un botón propio ──────────────────────────
 * `public/badges/app-store-es-mx-black.svg` es el artwork de Apple tal cual,
 * bajado de toolbox.marketingtools.apple.com (variante Latinoamérica, negra).
 * Las guías de marketing de Apple prohíben recrearlo o modificarlo y usar el
 * logo de Apple suelto — por eso no hay un botón armado con la manzana, ni acá
 * ni en el header. Lo que se respeta de esas guías:
 *   · negro, que es el obligatorio cuando convive con otra tienda;
 *   · primero en la fila;
 *   · alto ≥ 40px en pantalla (se usa 52px);
 *   · espacio libre de 1/4 del alto alrededor (13px: el `gap-4` deja 16px).
 * Si Apple publica una versión nueva, se reemplaza el archivo: nunca se edita.
 */

/** Alto común: Apple y Google piden que los badges de tienda que conviven midan lo mismo. */
const BADGE_HEIGHT = "h-[52px]";

/**
 * `href` permite pasar por un link con medición (`/d/<canal>`, que redirige a
 * esta misma ficha con `pt` y `ct` y registra el click). Sin él, va directo.
 */
export function AppStoreBadge({ href = APP_STORE_URL }: { href?: string }) {
  return (
    <a
      href={href}
      className="inline-flex shrink-0 rounded-[9px] transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary"
    >
      {/* `unoptimized`: es un SVG vectorial de 12 KB, el optimizador de Next no
          procesa SVG y rasterizarlo sólo lo haría más pesado. width/height con
          la proporción del artwork (≈3:1) y alto fijado por clase + `w-auto`,
          para que next/image no avise que se modificó un solo lado. */}
      <Image
        src="/badges/app-store-es-mx-black.svg"
        alt="Descargar en el App Store"
        width={156}
        height={52}
        unoptimized
        className={`${BADGE_HEIGHT} w-auto`}
      />
    </a>
  );
}

/**
 * ─── Google Play: badge OFICIAL, publicado desde el 12/10/2026 ─────────────
 * `public/badges/google-play-es-419.png` es el artwork de Google tal cual,
 * bajado de play.google.com/intl/en_us/badges (español de Latinoamérica). Las
 * guías de Google prohíben recrearlo o modificarlo. Mismo alto que el de
 * Apple, como piden las dos tiendas cuando los badges conviven.
 *
 * `href` como en el de Apple. Para medir, `/d/<canal>?tienda=play`: sin
 * `tienda=play`, una compu iría a la App Store.
 */
export function GooglePlayBadge({ href = PLAY_STORE_URL }: { href?: string }) {
  return (
    <a
      href={href}
      className="inline-flex shrink-0 rounded-[9px] transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary"
    >
      {/* PNG de 646×250 (≈2.6:1) con alto fijado por clase + `w-auto`, igual
          que el de Apple. */}
      <Image
        src="/badges/google-play-es-419.png"
        alt="Disponible en Google Play"
        width={134}
        height={52}
        className={`${BADGE_HEIGHT} w-auto`}
      />
    </a>
  );
}

export function StoreButtons({
  className = "",
  appStoreHref,
  playStoreHref,
}: {
  className?: string;
  appStoreHref?: string;
  playStoreHref?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      <AppStoreBadge href={appStoreHref} />
      <GooglePlayBadge href={playStoreHref} />
    </div>
  );
}
