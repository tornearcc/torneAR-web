import type { Metadata } from "next";
import { InstallRedirect } from "./InstallRedirect";
import { buildAppDeepLink, resolveUtmParams } from "./deep-link";

// Deferred deep linking (Fase 6.1 del roadmap, cierra R1/R2): esta es la
// página a la que cae un usuario que tocó https://tornear.app/i/<username>
// sin la app instalada, o en un dispositivo donde el SO no interceptó el
// Universal Link. Cero llamadas a Supabase — el username es solo texto
// para el copy, no se valida contra profiles acá (mismo criterio que
// set_referral, que resuelve el username recién con sesión creada).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username} te invitó a torneAR`,
  };
}

export default async function ReferralLandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { username } = await params;
  // UTM de campaña (Fase 3 de Marketing & Growth): el Content Factory del
  // dashboard etiqueta los links de sus tarjetas con esto. Sólo se leen y
  // se reenvían al deep link — esta página no llama a Supabase para nada,
  // así que no hay dónde persistirlos del lado del server tampoco.
  const utm = resolveUtmParams(await searchParams);
  const appDeepLink = buildAppDeepLink(username, utm);

  return (
    <section className="mx-auto flex max-w-lg flex-col items-center gap-8 px-6 py-20 text-center">
      <InstallRedirect href={appDeepLink} />

      <p className="font-display text-sm uppercase tracking-widest text-brand-primary">
        Invitación de torneAR
      </p>

      <h1 className="font-display text-4xl uppercase leading-tight text-neutral-on-surface sm:text-5xl">
        <span className="text-brand-primary">{username}</span> te invitó a jugar
      </h1>

      <p className="max-w-sm text-lg text-neutral-on-surface-variant">
        Armá tu equipo, desafiá rivales y subí en el ranking. Usá su código al
        registrarte para quedar vinculados.
      </p>

      <div className="w-full rounded-lg border border-neutral-outline-variant bg-surface-container p-4">
        <p className="text-xs uppercase tracking-widest text-neutral-on-surface-variant">
          Código de referido
        </p>
        <p className="font-display mt-1 text-2xl text-brand-primary">{username}</p>
      </div>

      <a
        href="#"
        aria-disabled="true"
        className="flex w-full items-center justify-center rounded-lg bg-brand-primary px-8 py-5 text-lg font-semibold text-brand-inverse-primary opacity-60 pointer-events-none"
      >
        Descargar la App
      </a>

      <a
        href={appDeepLink}
        className="text-sm text-neutral-on-surface-variant underline-offset-4 hover:text-neutral-on-surface hover:underline"
      >
        ¿Ya tenés la app? Abrila acá
      </a>

      <p className="text-sm text-neutral-on-surface-variant">
        Próximamente disponible — torneAR está en Beta cerrada.
      </p>
    </section>
  );
}
