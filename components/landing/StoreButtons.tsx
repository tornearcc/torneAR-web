import { APP_STORE_URL } from "@/lib/store-links";

/*
 * Botones de tienda de la zona pública (landing e invitaciones).
 *
 * Los logos van como SVG inline y no como imagen: son dos paths de pocos
 * bytes, heredan el color del texto con `currentColor` y no suman un request
 * en una página que se abre con datos móviles.
 */

export function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={className}>
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

function GooglePlayLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={className}>
      <path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z" />
    </svg>
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

export function AppStoreButton() {
  return (
    <a
      href={APP_STORE_URL}
      className="inline-flex items-center gap-3 rounded-xl bg-brand-primary py-2.5 pr-6 pl-4 text-surface-lowest shadow-[0_12px_40px_-12px_rgba(83,224,118,0.7)] transition hover:bg-brand-primary-fixed active:scale-[0.98]"
    >
      <AppleLogo className="size-8 shrink-0" />
      <span className="flex flex-col text-left leading-none">
        <span className="text-xs font-medium">Descargala en la</span>
        <span className="font-display text-[1.65rem] font-extrabold uppercase">App Store</span>
      </span>
    </a>
  );
}

/**
 * Bloqueado a propósito: la app todavía no está publicada en Google Play.
 * Es un `span` y no un link, así que no hay href que un tap pueda seguir.
 */
export function GooglePlaySoonButton() {
  return (
    <span
      aria-disabled="true"
      title="Todavía no está disponible en Google Play"
      className="inline-flex cursor-not-allowed items-center gap-3 rounded-xl border border-dashed border-neutral-outline-variant bg-surface-container/60 py-2.5 pr-4 pl-4 text-neutral-outline select-none"
    >
      <GooglePlayLogo className="size-7 shrink-0 opacity-60" />
      <span className="flex flex-col text-left leading-none">
        <span className="text-xs font-medium">Próximamente en</span>
        <span className="font-display text-[1.65rem] font-extrabold uppercase">Google Play</span>
      </span>
      <LockIcon className="ml-1 size-4 shrink-0 opacity-70" />
    </span>
  );
}

export function StoreButtons({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <AppStoreButton />
      <GooglePlaySoonButton />
    </div>
  );
}
