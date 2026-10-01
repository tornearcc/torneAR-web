import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Ingresar — torneAR admin",
};

// No cuelga de dashboard/layout.tsx (que tiene el guard de is_admin), así
// que nunca puede terminar en un loop de redirects contra sí misma.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    // `data-admin-shell`: misma paleta de cancha que el dashboard (globals.css).
    <div
      data-admin-shell
      className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-pitch px-4"
    >
      {error && (
        <p
          role="alert"
          className="w-full max-w-sm rounded-md border border-card-red/40 bg-card-red/10 px-3 py-2 text-center text-[15px] text-chalk"
        >
          Email o contraseña incorrectos.
        </p>
      )}

      <LoginForm />
    </div>
  );
}
