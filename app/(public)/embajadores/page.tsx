import type { Metadata } from "next";
import Link from "next/link";
import { PitchLines } from "@/components/landing/PitchLines";
import { StoreButtons } from "@/components/landing/StoreButtons";
import { AmbassadorBoard } from "@/components/embajadores/AmbassadorBoard";
import { EarningsCalculator } from "@/components/embajadores/EarningsCalculator";
import { Faq } from "@/components/embajadores/Faq";
import { FieldMock } from "@/components/embajadores/FieldMock";
import { MinimumsTable } from "@/components/embajadores/MinimumsTable";
import { SlotsCounter } from "@/components/embajadores/SlotsCounter";
import { OG_IMAGE } from "@/lib/site-metadata";

/*
 * Programa de Embajadores (v2, 21/10/2026). Estática: lo único que viene de la
 * base (cupos y ranking) se pide desde el navegador a /api/embajadores/tablero,
 * así la zona pública no importa lib/supabase. Se diseña para 390px: la letra
 * chica va visible al final y las reglas completas están en /legal/embajadores.
 */

const TITLE = "¿Querés ganar plata jugando al fútbol? — Embajadores de torneAR";
const DESCRIPTION =
  "$5.000 por cada equipo que traigas a torneAR y juegue su primer partido. Anotate como embajador desde la app.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: "torneAR",
    locale: "es_AR",
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [OG_IMAGE.url] },
};

const STEPS = [
  { n: "1", title: "Anotate en la app con tu Instagram" },
  { n: "2", title: "Pasale tu link a otros equipos" },
  { n: "3", title: "Cuando juegan su primer partido, cobrás $5.000 por cada uno" },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display border-b-2 border-brand-primary pb-3 text-3xl leading-none font-extrabold text-neutral-on-surface uppercase sm:text-5xl">
      {children}
    </h2>
  );
}

export default function AmbassadorsPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden">
        <PitchLines />
        <div className="mx-auto max-w-6xl px-5 pt-10 pb-16 sm:px-8 lg:pt-20 lg:pb-24">
          <h1 className="font-display max-w-4xl text-5xl leading-[0.92] font-extrabold tracking-tight text-balance text-neutral-on-surface uppercase sm:text-7xl lg:text-[5.5rem]">
            ¿Querés ganar plata jugando al fútbol?
          </h1>
          <p className="mt-6 max-w-xl text-xl text-neutral-on-surface">
            <strong className="font-extrabold text-brand-gold">$5.000</strong> por cada equipo que traigas a torneAR y
            juegue su primer partido.
          </p>
          <div className="mt-8 flex flex-col items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/d/embajador"
              className="inline-flex items-center rounded-xl bg-brand-primary px-6 py-3.5 text-lg font-extrabold text-surface-lowest transition hover:bg-brand-primary-fixed focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary"
            >
              Bajate la app y anotate
            </a>
            <SlotsCounter />
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ────────────────────────────────────────────────── */}
      <section className="border-y border-neutral-outline-variant bg-surface-lowest">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 lg:py-20">
          <SectionTitle>Cómo funciona</SectionTitle>
          <ol className="mt-2 divide-y divide-neutral-outline-variant">
            {STEPS.map((s) => (
              <li key={s.n} className="flex items-baseline gap-4 py-5">
                <span className="font-display text-5xl leading-none font-extrabold text-brand-primary">{s.n}</span>
                <span className="text-lg font-bold text-neutral-on-surface sm:text-xl">{s.title}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Extra de debut + bonos ───────────────────────────────────────── */}
      <section>
        <div className="mx-auto grid max-w-6xl gap-5 px-5 py-14 sm:px-8 lg:grid-cols-2 lg:py-20">
          <div className="rounded-2xl border border-brand-gold/40 bg-brand-gold/10 p-6">
            <h2 className="font-display text-3xl leading-none font-extrabold text-brand-gold uppercase">
              Extra de debut
            </h2>
            <p className="mt-4 text-lg text-neutral-on-surface">
              ¿Tenés equipo? Si su primer partido es contra un equipo que trajiste, sumás $5.000 más: ese partido te
              deja $10.000.
            </p>
          </div>
          <div className="rounded-2xl border border-brand-primary/40 bg-brand-primary/10 p-6">
            <h2 className="font-display text-3xl leading-none font-extrabold text-brand-primary uppercase">Bonos</h2>
            <p className="mt-4 text-lg text-neutral-on-surface">
              Llegá a 5 equipos y sumás $5.000 más. Llegá a 10 y sumás otros $5.000.
            </p>
          </div>
        </div>
      </section>

      {/* ── Calculadora ──────────────────────────────────────────────────── */}
      <section className="border-y border-neutral-outline-variant bg-surface-lowest">
        <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8 lg:py-20">
          <SectionTitle>Calculá cuánto ganás</SectionTitle>
          <div className="mt-6">
            <EarningsCalculator />
          </div>
        </div>
      </section>

      {/* ── Dónde cargan tu usuario ──────────────────────────────────────── */}
      <section>
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-2 lg:py-20">
          <div>
            <SectionTitle>Dónde cargan tu usuario</SectionTitle>
            <p className="mt-5 max-w-md text-lg text-neutral-on-surface-variant">
              Al crear su equipo, el capitán pone tu usuario en «¿Quién los invitó?». Si olvidan hacerlo, tienen 24
              horas para cargarlo y mientras el equipo no haya jugado ningún partido. Después queda fijo.
            </p>
          </div>
          <FieldMock />
        </div>
      </section>

      {/* ── Partido válido y mínimos ─────────────────────────────────────── */}
      <section className="border-y border-neutral-outline-variant bg-surface-lowest">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 lg:py-20">
          <SectionTitle>Para que el partido cuente</SectionTitle>
          <div className="mt-6">
            <MinimumsTable />
          </div>
        </div>
      </section>

      {/* ── Requisitos ───────────────────────────────────────────────────── */}
      <section>
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 lg:py-20">
          <SectionTitle>Qué necesitás</SectionTitle>
          <ul className="mt-6 flex max-w-2xl flex-col gap-4 text-lg text-neutral-on-surface">
            <li>
              Tener Instagram y seguir a <strong>@tornear.app</strong>. Lo verificamos nosotros antes de pagarte.
              <div className="mt-3">
                <a
                  href="https://instagram.com/tornear.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg border border-brand-primary/40 bg-brand-primary/10 px-4 py-2 text-base font-bold text-brand-primary transition-colors hover:bg-brand-primary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
                >
                  Seguir a @tornear.app
                </a>
              </div>
            </li>
            <li>Ser mayor de 18 años.</li>
            <li>Tener un alias o CBU a tu nombre para cobrar. Te lo pedimos recién cuando tenés un premio.</li>
          </ul>
        </div>
      </section>

      {/* ── Ranking ──────────────────────────────────────────────────────── */}
      <section className="border-y border-neutral-outline-variant bg-surface-lowest">
        <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8 lg:py-20">
          <SectionTitle>Ranking de embajadores</SectionTitle>
          <p className="mt-4 text-sm text-neutral-on-surface-variant">
            Aparecen sólo los embajadores que eligieron mostrarse.
          </p>
          <div className="mt-4">
            <AmbassadorBoard />
          </div>
        </div>
      </section>

      {/* ── Preguntas frecuentes ─────────────────────────────────────────── */}
      <section>
        <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8 lg:py-20">
          <SectionTitle>Preguntas frecuentes</SectionTitle>
          <div className="mt-6">
            <Faq />
          </div>
        </div>
      </section>

      {/* ── Letra chica ──────────────────────────────────────────────────── */}
      <section className="border-t border-neutral-outline-variant bg-surface-lowest">
        <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
          <h2 className="font-display text-2xl font-bold text-neutral-on-surface uppercase">La letra chica</h2>
          <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-base text-neutral-on-surface-variant">
            <li>Cada equipo traído paga una sola vez: $5.000 cuando juega su primer partido válido.</li>
            <li>
              El programa termina cuando 100 equipos traídos jugaron su primer partido válido. No tiene fecha de fin.
            </li>
            <li>
              El extra de debut se paga una sola vez, y sólo si el primer partido válido de tu equipo es contra uno
              que trajiste vos. Si es contra otro, se pierde.
            </li>
            <li>Los bonos de 5 y 10 equipos se pagan una vez cada uno.</li>
            <li>
              Cada jugador cuenta para un solo equipo por embajador, y un equipo traído no genera premio si estás en
              su plantel.
            </li>
            <li>
              Revisamos cada premio antes de pagarlo y podemos rechazarlo o suspender al embajador si detectamos
              engaños. Pagamos por transferencia o Mercado Pago dentro de los 7 días, con el follow verificado.
            </li>
            <li>Inscribirte implica aceptar las bases.</li>
          </ul>
          <p className="mt-5">
            <Link
              href="/legal/embajadores"
              className="font-bold text-brand-primary underline underline-offset-4 hover:text-brand-primary-fixed"
            >
              Leer las bases completas
            </Link>
          </p>
          <div className="mt-8">
            <StoreButtons appStoreHref="/d/embajador?tienda=ios" playStoreHref="/d/embajador?tienda=play" />
          </div>
        </div>
      </section>
    </>
  );
}
