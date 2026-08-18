import type { Metadata } from "next";
import { signInWithPassword } from "@/lib/auth-actions";

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
    <div className="flex min-h-screen items-center justify-center bg-surface-lowest px-6">
      <form
        action={signInWithPassword}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-neutral-outline-variant bg-surface-container p-8"
      >
        <h1 className="font-display text-center text-2xl uppercase text-neutral-on-surface">
          torneAR admin
        </h1>

        {error && (
          <p
            role="alert"
            className="rounded-md bg-danger-error-container px-3 py-2 text-sm text-danger-on-error-container"
          >
            Email o contraseña incorrectos.
          </p>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm text-neutral-on-surface-variant">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-md border border-neutral-outline-variant bg-surface-low px-3 py-2 text-neutral-on-surface outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm text-neutral-on-surface-variant">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded-md border border-neutral-outline-variant bg-surface-low px-3 py-2 text-neutral-on-surface outline-none focus:border-brand-primary"
          />
        </div>

        <button
          type="submit"
          className="mt-2 rounded-md bg-brand-primary px-4 py-2 font-semibold text-brand-inverse-primary transition hover:bg-brand-primary-container"
        >
          Ingresar
        </button>
      </form>
    </div>
  );
}
