import type { Metadata } from "next";
import { PhoneFrame } from "@/components/landing/PhoneFrame";
import { PitchLines } from "@/components/landing/PitchLines";
import { StoreButtons } from "@/components/landing/StoreButtons";
import { OG_IMAGE } from "@/lib/site-metadata";
import {
  buildAppDeepLink,
  buildTeamJoinDeepLink,
  resolveUtmParams,
} from "./deep-link";
import { sanitizeInviteName } from "./invite-name";
import { resolveTeamInvite, type TeamInvite } from "./team-invite";

// Página a la que cae quien toca https://tornear.vercel.app/i/<username> sin
// la app instalada: con la app, el Universal Link lo intercepta el SO y esta
// página nunca se ve. Cero llamadas a Supabase — el username es solo texto
// para el copy, no se valida contra profiles acá (mismo criterio que
// set_referral, que resuelve el username recién con sesión creada).
//
// No hay salto automático al scheme `tornear://`: quien ve esta página es, por
// definición, quien no tiene la app, y en Safari ese salto le mostraba el error
// de dirección inválida como primera impresión. El link manual de abajo queda
// para el caso raro en que el SO no interceptó el Universal Link teniendo la
// app instalada.

type InvitePageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const INVITE_DESCRIPTION =
  "Sumate a torneAR: cargá tus partidos, desafiá rivales y subí en el ranking de tu zona. Gratis para iPhone.";

const TEAM_INVITE_DESCRIPTION =
  "Bajate torneAR, pedí entrar al equipo y empezá a jugar partidos que suman en el ranking de tu zona. Gratis para iPhone.";

export async function generateMetadata({
  params,
  searchParams,
}: InvitePageProps): Promise<Metadata> {
  const { username } = await params;
  const query = await searchParams;
  const inviter = sanitizeInviteName(query.n) ?? username;
  const teamInvite = resolveTeamInvite(query);
  const teamLabel = teamInvite?.teamName ?? "su equipo";
  const title = teamInvite
    ? `${inviter} te invitó a sumarte a ${teamLabel} en torneAR`
    : `${inviter} te invitó a jugar en torneAR`;
  const description = teamInvite ? TEAM_INVITE_DESCRIPTION : INVITE_DESCRIPTION;

  // `openGraph` y `twitter` completos, no sólo el título: Next mezcla la
  // metadata de forma superficial y declarar estos objetos acá reemplaza los
  // del layout raíz enteros, imagen incluida.
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "torneAR",
      locale: "es_AR",
      type: "website",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE.url],
    },
  };
}

export default async function ReferralLandingPage({
  params,
  searchParams,
}: InvitePageProps) {
  const { username } = await params;
  const query = await searchParams;
  // `?n=` es opcional: los links que ya circulan no lo traen, y ahí se muestra
  // el username, como antes.
  const inviter = sanitizeInviteName(query.n) ?? username;
  // UTM de campaña (Fase 3 de Marketing & Growth): el Content Factory del
  // dashboard etiqueta los links de sus tarjetas con esto. Sólo se leen y
  // se reenvían al deep link — esta página no llama a Supabase para nada,
  // así que no hay dónde persistirlos del lado del server tampoco.
  const appDeepLink = buildAppDeepLink(username, resolveUtmParams(query));
  const teamInvite = resolveTeamInvite(query);

  return (
    <section className="relative isolate overflow-hidden">
      <PitchLines />

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pt-10 pb-16 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10 lg:pt-20 lg:pb-24">
        {teamInvite ? (
          <TeamInviteContent inviter={inviter} invite={teamInvite} />
        ) : (
          <div className="flex min-w-0 flex-col items-start gap-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-gold/40 bg-brand-gold/10 px-3 py-1 font-display text-sm font-bold tracking-widest text-brand-gold uppercase">
              Invitación
            </p>

            <h1 className="font-display w-full text-5xl leading-[0.92] font-extrabold tracking-tight text-neutral-on-surface uppercase [overflow-wrap:anywhere] sm:text-7xl">
              <span className="text-brand-primary">{inviter}</span>
              <br />
              te invitó a jugar
            </h1>

            <p className="max-w-md text-lg text-neutral-on-surface-variant">
              Bajate torneAR: cada partido que juegues queda cargado y suma a la
              tabla de tu zona.
            </p>

            <StoreButtons />

            {/* El código es el username y lo pide la app en el onboarding
              ("¿Tenés un código de invitación?"). Si la app se baja desde la
              tienda, el `ref` del link se pierde en el camino y ese campo llega
              vacío: tipearlo a mano es la única forma de quedar vinculados. */}
            <div className="w-full max-w-md rounded-xl border border-neutral-outline-variant bg-surface-container p-4">
              <p className="text-xs font-bold tracking-widest text-neutral-outline uppercase">
                Código de invitación
              </p>
              <p className="font-display mt-1 text-3xl font-extrabold break-all text-brand-primary">
                {username}
              </p>
              <p className="mt-2 text-sm text-neutral-on-surface-variant">
                Si al registrarte no aparece completo, escribilo en «¿Tenés un
                código de invitación?».
              </p>
            </div>

            <a
              href={appDeepLink}
              className="text-sm text-neutral-on-surface-variant underline underline-offset-4 hover:text-neutral-on-surface"
            >
              ¿Ya tenés la app? Abrila acá
            </a>
          </div>
        )}

        <div className="relative mx-auto w-full max-w-[17rem] lg:max-w-[21rem]">
          <div
            aria-hidden="true"
            className="absolute inset-x-4 top-16 bottom-16 -z-10 rounded-full bg-brand-primary/20 blur-3xl"
          />
          <PhoneFrame
            src="/landing/ranking.jpg"
            alt="Ranking de torneAR: tabla de mejores equipos y goleadores de la temporada"
            sizes="(min-width: 1024px) 336px, 272px"
            className="w-full -rotate-3"
          />
        </div>
      </div>
    </section>
  );
}

/**
 * Versión de equipo de la invitación (Tanda 7, P1-11): quien la ve no tiene la
 * app, así que el orden es bajarla, entrar y pedir sumarse con el código. El
 * botón del App Store pasa por `/d/equipo` para contar cuántos invitados
 * llegan a la tienda.
 */
function TeamInviteContent({
  inviter,
  invite,
}: {
  inviter: string;
  invite: TeamInvite;
}) {
  const teamLabel = invite.teamName ?? "su equipo";

  return (
    <div className="flex min-w-0 flex-col items-start gap-6">
      <p className="inline-flex items-center gap-2 rounded-full border border-brand-gold/40 bg-brand-gold/10 px-3 py-1 font-display text-sm font-bold tracking-widest text-brand-gold uppercase">
        Invitación a un equipo
      </p>

      <h1 className="font-display w-full text-5xl leading-[0.92] font-extrabold tracking-tight text-neutral-on-surface uppercase [overflow-wrap:anywhere] sm:text-7xl">
        Sumate a
        <br />
        <span className="text-brand-primary">{teamLabel}</span>
      </h1>

      <p className="max-w-md text-lg text-neutral-on-surface-variant">
        {inviter} te invitó a su equipo en torneAR. Cada partido que jueguen
        queda cargado y suma a la tabla de su zona.
      </p>

      <ol className="flex w-full max-w-md flex-col gap-3 text-neutral-on-surface">
        {[
          "Bajate torneAR y creá tu cuenta.",
          "Tocá «Unirme a un equipo» y poné el código de abajo.",
          `Mandá la solicitud: ${inviter} la acepta y ya estás en el plantel.`,
        ].map((step, index) => (
          <li key={step} className="flex items-start gap-3">
            <span className="font-display flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-primary/15 text-sm font-extrabold text-brand-primary">
              {index + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>

      <StoreButtons appStoreHref="/d/equipo" />

      <div className="w-full max-w-md rounded-xl border border-neutral-outline-variant bg-surface-container p-4">
        <p className="text-xs font-bold tracking-widest text-neutral-outline uppercase">
          Código del equipo
        </p>
        <p className="font-display mt-1 text-3xl font-extrabold tracking-widest break-all text-brand-primary">
          {invite.code}
        </p>
        <p className="mt-2 text-sm text-neutral-on-surface-variant">
          Lo vas a necesitar después de registrarte: la tienda no se lo pasa a
          la app.
        </p>
      </div>

      <a
        href={buildTeamJoinDeepLink(invite.code)}
        className="text-sm text-neutral-on-surface-variant underline underline-offset-4 hover:text-neutral-on-surface"
      >
        ¿Ya tenés la app? Abrila acá
      </a>
    </div>
  );
}
