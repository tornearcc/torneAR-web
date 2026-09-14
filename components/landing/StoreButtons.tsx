import Image from "next/image";
import { APP_STORE_URL } from "@/lib/store-links";

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

export function AppStoreBadge() {
  return (
    <a
      href={APP_STORE_URL}
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

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

/**
 * Bloqueado a propósito: la app todavía no está publicada en Google Play. Es
 * un `span`, sin href que un tap pueda seguir.
 *
 * Sin el badge ni el ícono de Google Play: sus guías de marca los reservan
 * para apps que ya están disponibles en la tienda. Nombrarla en texto para
 * avisar que viene sí está permitido. Cuando se publique, este componente se
 * reemplaza por el badge oficial de Google, con el mismo alto que el de Apple.
 */
export function GooglePlaySoonButton() {
  return (
    <span
      aria-disabled="true"
      title="Todavía no está disponible en Google Play"
      className={`inline-flex ${BADGE_HEIGHT} shrink-0 cursor-not-allowed items-center gap-2.5 rounded-[9px] border border-dashed border-neutral-outline-variant bg-surface-container/60 px-4 text-neutral-outline select-none`}
    >
      <LockIcon className="size-4 shrink-0 opacity-70" />
      <span className="flex flex-col text-left leading-none">
        <span className="text-[11px] font-medium">Próximamente en</span>
        <span className="font-display text-xl font-extrabold uppercase">Google Play</span>
      </span>
    </span>
  );
}

export function StoreButtons({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      <AppStoreBadge />
      <GooglePlaySoonButton />
    </div>
  );
}
