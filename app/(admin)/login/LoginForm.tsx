"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { signInWithPassword } from "@/lib/auth-actions";

// `signInWithPassword` siempre redirige (nunca retorna un valor normal),
// así que el estado de `useActionState` no se usa — solo nos interesa el
// `isPending` que expone mientras dura el roundtrip a Supabase.
async function loginAction(_prevState: unknown, formData: FormData) {
  await signInWithPassword(formData);
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 flex items-center justify-center gap-2 rounded-md bg-brand-primary px-4 py-2 font-semibold text-brand-inverse-primary transition hover:bg-brand-primary-container disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Ingresando...
        </>
      ) : (
        "Ingresar"
      )}
    </button>
  );
}

export function LoginForm() {
  const [, formAction] = useActionState(loginAction, undefined);

  return (
    <form
      action={formAction}
      className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-neutral-outline-variant bg-surface-container p-8"
    >
      <h1 className="font-display text-center text-2xl uppercase text-neutral-on-surface">
        torneAR admin
      </h1>

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

      <SubmitButton />
    </form>
  );
}
