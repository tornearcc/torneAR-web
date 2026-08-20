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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-lowest px-6">
      {error && (
        <p
          role="alert"
          className="w-full max-w-sm rounded-md bg-danger-error-container px-3 py-2 text-center text-sm text-danger-on-error-container"
        >
          Email o contraseña incorrectos.
        </p>
      )}

      <LoginForm />
    </div>
  );
}
