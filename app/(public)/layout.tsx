import Image from "next/image";
import Link from "next/link";

// Zona pública: cero sesión, cero cliente de Supabase (§0 de
// WEB_SPECIFICATION.md) — este layout y todo lo que cuelga de él no debe
// importar nada de lib/supabase.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-neutral-outline-variant">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/TorneAR_Logo_Nombre_1.png"
              alt="torneAR"
              width={192}
              height={192}
              priority
            />
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-neutral-outline-variant">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-8 text-sm text-neutral-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} torneAR. Todos los derechos reservados.</p>
          <nav className="flex gap-4">
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
