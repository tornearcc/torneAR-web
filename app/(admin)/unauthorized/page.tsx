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
    <div
      data-admin-shell
      className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-pitch px-4 text-center"
    >
      <h1 className="text-[28px] font-semibold tracking-tight text-chalk">
        Acceso denegado
      </h1>
      <p className="max-w-sm text-[15px] text-chalk-dim">
        Esta cuenta no tiene privilegios de administrador.
      </p>
      <div className="mt-2 flex gap-3">
        <Link
          href="/"
          className="rounded-md border border-chalk-line px-4 py-2 text-sm font-medium text-chalk transition-colors hover:bg-slate"
        >
          Volver al inicio
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md bg-go px-4 py-2 text-sm font-medium text-on-card transition-colors hover:bg-go/90"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
