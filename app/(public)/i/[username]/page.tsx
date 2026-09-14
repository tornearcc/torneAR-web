import type { Metadata } from "next";
import { OG_IMAGE } from "@/lib/site-metadata";
import { APP_STORE_URL } from "@/lib/store-links";
import { buildAppDeepLink, resolveUtmParams } from "./deep-link";
import { sanitizeInviteName } from "./invite-name";

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

export async function generateMetadata({ params, searchParams }: InvitePageProps): Promise<Metadata> {
  const { username } = await params;
  const inviter = sanitizeInviteName((await searchParams).n) ?? username;
  const title = `${inviter} te invitó a jugar en torneAR`;

  // `openGraph` y `twitter` completos, no sólo el título: Next mezcla la
  // metadata de forma superficial y declarar estos objetos acá reemplaza los
  // del layout raíz enteros, imagen incluida.
  return {
    title,
    description: INVITE_DESCRIPTION,
    openGraph: {
      title,
      description: INVITE_DESCRIPTION,
      siteName: "torneAR",
      locale: "es_AR",
      type: "website",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: INVITE_DESCRIPTION,
      images: [OG_IMAGE.url],
    },
  };
}

export default async function ReferralLandingPage({ params, searchParams }: InvitePageProps) {
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

  return (
    <section className="mx-auto flex max-w-lg flex-col items-center gap-8 px-6 py-20 text-center">
      <p className="font-display text-sm uppercase tracking-widest text-brand-primary">
        Invitación de torneAR
      </p>

      <h1 className="font-display text-4xl uppercase leading-tight text-neutral-on-surface sm:text-5xl">
        <span className="break-words text-brand-primary">{inviter}</span> te invitó a jugar
      </h1>

      <p className="max-w-sm text-lg text-neutral-on-surface-variant">
        Armá tu equipo, desafiá rivales y subí en el ranking.
      </p>

      {/* El código es el username y lo pide la app en el onboarding
          ("¿Tenés un código de invitación?"). Si la app se baja desde la
          tienda, el `ref` del link se pierde en el camino y ese campo llega
          vacío: tipearlo a mano es la única forma de quedar vinculados. */}
      <div className="w-full rounded-lg border border-neutral-outline-variant bg-surface-container p-4">
        <p className="text-xs uppercase tracking-widest text-neutral-on-surface-variant">
          Código de invitación
        </p>
        <p className="font-display mt-1 break-all text-2xl text-brand-primary">{username}</p>
        <p className="mt-2 text-sm text-neutral-on-surface-variant">
          Si al registrarte no aparece completo, escribilo en «¿Tenés un código de invitación?».
        </p>
      </div>

      <a
        href={APP_STORE_URL}
        className="flex w-full items-center justify-center rounded-lg bg-brand-primary px-8 py-5 text-lg font-semibold text-brand-inverse-primary"
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
        Gratis para iPhone.
      </p>
    </section>
  );
}
