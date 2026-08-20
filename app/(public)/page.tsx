import Image from "next/image";

const FEATURES = [
  {
    title: "Armá tu equipo",
    description:
      "Sumá jugadores, definí tu formación y llevá el control de quién juega cada fecha.",
  },
  {
    title: "Desafiá rivales",
    description:
      "Buscá equipos de tu zona y nivel, y coordiná partidos sin cadenas infinitas de WhatsApp.",
  },
  {
    title: "Rankings que importan",
    description:
      "Cada resultado suma. Segui tu posición en la tabla y la de tus rivales en tiempo real.",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Creá tu perfil",
    description: "Registrate y armá tu equipo o sumate a uno existente.",
  },
  {
    step: "2",
    title: "Buscá partidos",
    description: "Encontrá rivales disponibles según zona, día y nivel.",
  },
  {
    step: "3",
    title: "Jugá y cargá el resultado",
    description: "Registrá el resultado y subí en el ranking de la comunidad.",
  },
];

const STATS = [
  { value: "+500", label: "Equipos en beta cerrada" },
  { value: "+1200", label: "Partidos coordinados" },
  { value: "15", label: "Ciudades activas" },
];

export default function LandingPage() {
  return (
    <>
      <section className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-6 py-20 text-center sm:py-28">
        <Image
          src="/logo-tornear.png"
          alt=""
          width={96}
          height={96}
          priority
        />

        <h1 className="font-display max-w-3xl text-4xl uppercase leading-tight text-neutral-on-surface sm:text-6xl">
          El fútbol amateur, ahora con algo en juego
        </h1>

        <p className="max-w-xl text-lg text-neutral-on-surface-variant">
          Armá tu equipo, desafiá rivales y subí en el ranking. torneAR
          organiza tus partidos de fútbol 5, 7 y 11 — vos solo llevá la
          pelota.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <a
            href="#"
            aria-disabled="true"
            className="flex items-center justify-center rounded-lg bg-brand-primary px-6 py-3 font-semibold text-brand-inverse-primary opacity-60 pointer-events-none"
          >
            Descargar en App Store
          </a>
          <a
            href="#"
            aria-disabled="true"
            className="flex items-center justify-center rounded-lg border border-neutral-outline px-6 py-3 font-semibold text-neutral-on-surface opacity-60 pointer-events-none"
          >
            Descargar en Google Play
          </a>
        </div>

        <p className="text-sm text-neutral-on-surface-variant">
          Próximamente disponible — torneAR está en Beta cerrada.
        </p>
      </section>

      <section
        aria-labelledby="features-heading"
        className="border-t border-neutral-outline-variant bg-surface-container"
      >
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <h2
            id="features-heading"
            className="font-display text-center text-2xl uppercase text-neutral-on-surface sm:text-3xl"
          >
            Características
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex flex-col gap-2 text-center sm:text-left">
                <h3 className="font-semibold text-neutral-on-surface">
                  {feature.title}
                </h3>
                <p className="text-sm text-neutral-on-surface-variant">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="how-it-works-heading" className="border-t border-neutral-outline-variant">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <h2
            id="how-it-works-heading"
            className="font-display text-center text-2xl uppercase text-neutral-on-surface sm:text-3xl"
          >
            Cómo funciona
          </h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map((item) => (
              <li key={item.step} className="flex flex-col items-center gap-2 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary font-display text-lg text-brand-inverse-primary">
                  {item.step}
                </span>
                <h3 className="font-semibold text-neutral-on-surface">{item.title}</h3>
                <p className="text-sm text-neutral-on-surface-variant">
                  {item.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        aria-labelledby="stats-heading"
        className="border-t border-neutral-outline-variant bg-surface-container"
      >
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <h2 id="stats-heading" className="sr-only">
            Estadísticas
          </h2>
          <div className="grid gap-8 text-center sm:grid-cols-3">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <span className="font-display text-4xl text-brand-primary sm:text-5xl">
                  {stat.value}
                </span>
                <span className="text-sm text-neutral-on-surface-variant">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
