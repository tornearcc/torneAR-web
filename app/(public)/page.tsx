import { PhoneFrame } from "@/components/landing/PhoneFrame";
import { PitchLines } from "@/components/landing/PitchLines";
import { StoreButtons } from "@/components/landing/StoreButtons";

/*
 * Landing pública. Casi todo el tráfico llega desde un link de WhatsApp,
 * abierto en un teléfono: se diseña para 390px y el botón de descarga tiene
 * que verse sin scroll. Sin números de uso: los reales todavía no alcanzan
 * para mostrarlos, y uno inventado en la página de la campaña es peor que
 * ninguno.
 */

const STEPS = [
  {
    n: "01",
    title: "Armá tu equipo",
    text: "Creá el equipo, subí el escudo y sumá a los pibes con el código de invitación.",
  },
  {
    n: "02",
    title: "Desafiá rivales",
    text: "Buscá equipos de tu zona y de tu nivel, y cerrá día, hora y cancha sin cadenas de WhatsApp.",
  },
  {
    n: "03",
    title: "Jugá y cargá el resultado",
    text: "Check-in en la cancha, goles y MVP. Cada partido suma a la tabla.",
  },
];

const SHOWCASE = [
  {
    src: "/landing/perfil.jpg",
    alt: "Perfil de jugador en torneAR con partidos, goles, MVPs, victorias e insignias",
    eyebrow: "Tu perfil",
    title: "Tus números, siempre a mano",
    text: "Partidos, goles, MVPs, victorias e insignias. Todo lo que jugás queda guardado.",
  },
  {
    src: "/landing/partido.jpg",
    alt: "Detalle de un partido en torneAR con código de invitados, cancha, horario y check-in",
    eyebrow: "Día de partido",
    title: "Check-in en la cancha",
    text: "Cada uno confirma que llegó desde el complejo, y queda registrado quién jugó.",
  },
  {
    src: "/landing/partidos.jpg",
    alt: "Lista de próximos partidos en torneAR con el acceso para ingresar un código de invitación",
    eyebrow: "La agenda",
    title: "Todos tus partidos",
    text: "Próximos partidos, historial y un código para sumarte al partido de otro equipo.",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden">
        <PitchLines />

        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pt-10 pb-16 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10 lg:pt-20 lg:pb-24">
          <div className="flex min-w-0 flex-col items-start gap-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-primary/30 bg-brand-primary/10 px-3 py-1 font-display text-sm font-bold tracking-widest text-brand-primary uppercase">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-primary opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-brand-primary" />
              </span>
              Clausura 2026 en juego
            </p>

            <h1 className="font-display text-5xl leading-[0.92] font-extrabold tracking-tight text-neutral-on-surface uppercase sm:text-7xl lg:text-[5.5rem]">
              El sábado ganaste.
              <br />
              <span className="text-brand-primary">¿Quién se acuerda?</span>
            </h1>

            <p className="max-w-md text-lg text-neutral-on-surface-variant">
              Cada partido que jugás queda cargado —resultado, goles y MVP— y suma a una tabla real de tu zona.
            </p>

            <StoreButtons />

            <p className="text-sm text-neutral-outline">Gratis para iPhone · Fútbol 5 a 11</p>
          </div>

          <div className="relative mx-auto w-full max-w-[19rem] lg:max-w-[21rem]">
            <div
              aria-hidden="true"
              className="absolute inset-x-4 top-16 bottom-16 -z-10 rounded-full bg-brand-primary/20 blur-3xl"
            />
            <PhoneFrame
              src="/landing/ranking.jpg"
              alt="Ranking de torneAR: tabla de mejores equipos y goleadores de la temporada"
              sizes="(min-width: 1024px) 336px, 304px"
              priority
              className="w-full -rotate-3"
            />
            <div className="absolute bottom-20 -left-3 flex items-center gap-2 rounded-xl border border-neutral-outline-variant bg-surface-container/95 px-3 py-2 shadow-xl sm:-left-10">
              <span className="font-display text-2xl leading-none font-extrabold text-brand-gold">#1</span>
              <span className="text-xs leading-tight font-bold text-neutral-on-surface">
                Ranking por
                <br />
                zona y formato
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cómo se juega: armado como una tabla de posiciones ───────────── */}
      <section className="border-y border-neutral-outline-variant bg-surface-lowest">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
          <div className="flex items-end justify-between gap-4 border-b-2 border-brand-primary pb-4">
            <h2 className="font-display text-4xl leading-none font-extrabold text-neutral-on-surface uppercase sm:text-6xl">
              Cómo se juega
            </h2>
            <span className="font-display text-sm font-bold tracking-widest text-neutral-outline uppercase">
              3 pasos
            </span>
          </div>

          <div
            aria-hidden="true"
            className="hidden grid-cols-[6rem_1fr_1.3fr] gap-8 border-b border-neutral-outline-variant py-3 text-xs font-bold tracking-widest text-neutral-outline uppercase sm:grid"
          >
            <span>#</span>
            <span>Paso</span>
            <span>Detalle</span>
          </div>

          <ol className="divide-y divide-neutral-outline-variant">
            {STEPS.map((step) => (
              <li
                key={step.n}
                className="grid grid-cols-[3.5rem_1fr] gap-x-4 gap-y-2 py-6 sm:grid-cols-[6rem_1fr_1.3fr] sm:items-baseline sm:gap-8"
              >
                <span className="font-display row-span-2 text-5xl leading-none font-extrabold text-brand-primary sm:row-span-1 sm:text-6xl">
                  {step.n}
                </span>
                <h3 className="font-display text-2xl leading-tight font-bold text-neutral-on-surface uppercase sm:text-3xl">
                  {step.title}
                </h3>
                <p className="text-neutral-on-surface-variant">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Pantallas reales ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
        <h2 className="font-display max-w-2xl text-4xl leading-[0.95] font-extrabold text-neutral-on-surface uppercase sm:text-6xl">
          Lo que pasa en la cancha, <span className="text-brand-primary">queda.</span>
        </h2>

        <div className="-mx-5 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0">
          {SHOWCASE.map((item) => (
            <article
              key={item.src}
              className="flex w-[80%] shrink-0 snap-center flex-col gap-6 rounded-2xl border border-neutral-outline-variant bg-surface-container p-5 sm:w-auto"
            >
              <PhoneFrame
                src={item.src}
                alt={item.alt}
                sizes="(min-width: 640px) 240px, 70vw"
                className="mx-auto w-full max-w-[15rem]"
              />
              <div>
                <p className="font-display text-sm font-bold tracking-widest text-brand-gold uppercase">
                  {item.eyebrow}
                </p>
                <h3 className="font-display mt-1 text-2xl leading-tight font-bold text-neutral-on-surface uppercase">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-neutral-on-surface-variant">{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Cierre ───────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden border-t border-neutral-outline-variant bg-surface-lowest">
        <PitchLines />
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-5 py-20 text-center sm:py-28">
          <h2 className="font-display text-5xl leading-[0.92] font-extrabold text-neutral-on-surface uppercase sm:text-7xl">
            La tabla recién <span className="text-brand-primary">arranca</span>
          </h2>
          <p className="max-w-md text-lg text-neutral-on-surface-variant">
            Que tu equipo esté desde la primera fecha. Bajala gratis y cargá tu primer partido.
          </p>
          <StoreButtons className="justify-center" />
        </div>
      </section>
    </>
  );
}
