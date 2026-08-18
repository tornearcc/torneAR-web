import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/lib/auth-actions";

export const metadata: Metadata = {
  title: "Acceso denegado — torneAR admin",
};

// Tampoco cuelga de dashboard/layout.tsx, por la misma razón que /login:
// requireAdminAuth() redirige acá, así que esta pantalla no puede pasar
// por ese mismo guard sin generar un loop.
export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-lowest px-6 text-center">
      <h1 className="font-display text-2xl uppercase text-neutral-on-surface">
        Acceso Denegado
      </h1>
      <p className="max-w-sm text-neutral-on-surface-variant">
        Esta cuenta no tiene privilegios de administrador.
      </p>
      <div className="mt-2 flex gap-3">
        <Link
          href="/"
          className="rounded-md border border-neutral-outline px-4 py-2 text-sm font-semibold text-neutral-on-surface transition hover:bg-surface-container"
        >
          Volver al inicio
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-inverse-primary transition hover:bg-brand-primary-container"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
