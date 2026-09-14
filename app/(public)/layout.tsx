import Image from "next/image";
import Link from "next/link";
import { APP_STORE_URL } from "@/lib/store-links";

// Zona pública: cero sesión, cero cliente de Supabase (§0 de
// WEB_SPECIFICATION.md) — este layout y todo lo que cuelga de él no debe
// importar nada de lib/supabase.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-neutral-outline-variant/60 bg-surface-base/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="torneAR — inicio" className="flex items-center">
            {/* `logo-header.png` es `TorneAR_Logo_Nombre_1.png` sin el aire
                transparente que traía alrededor (con ese margen, un logo de
                44px de caja se veía de ~26px) y bajado a 450×128: pesa 13 KB
                contra 393 KB del original. width/height con esa proporción
                (≈3.5:1) y `w-auto`, para que el `height: auto` del preflight
                de Tailwind no recalcule un solo lado y next/image avise. */}
            <Image
              src="/logo-header.png"
              alt="torneAR"
              width={176}
              height={50}
              priority
              className="h-9 w-auto sm:h-10"
            />
          </Link>

          {/* Sin logo de Apple: las guías de Apple sólo lo permiten dentro del
              badge oficial (ver components/landing/StoreButtons.tsx). */}
          <a
            href={APP_STORE_URL}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-1.5 text-sm font-bold text-surface-lowest transition hover:bg-brand-primary-fixed"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
            </svg>
            Descargar
          </a>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-neutral-outline-variant bg-surface-lowest">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-neutral-on-surface-variant sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} torneAR. Hecho para el fútbol amateur argentino.</p>
          <nav className="flex gap-5">
            <Link href="/legal/tyc" className="hover:text-neutral-on-surface">
              Términos y Condiciones
            </Link>
            <Link href="/legal/privacidad" className="hover:text-neutral-on-surface">
              Política de Privacidad
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
