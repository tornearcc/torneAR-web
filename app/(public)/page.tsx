import Image from "next/image";

export default function LandingPage() {
  return (
    <section className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-6 py-20 text-center sm:py-28">
      <Image
        src="/logo-tornear.png"
        alt=""
        width={96}
        height={96}
        className="h-24 w-24"
        priority
      />

      <h1 className="font-display max-w-3xl text-4xl uppercase leading-tight text-neutral-on-surface sm:text-6xl">
        El fútbol amateur, ahora con algo en juego
      </h1>

      <p className="max-w-xl text-lg text-neutral-on-surface-variant">
        Armá tu equipo, desafiá rivales y subí en el ranking. torneAR organiza
        tus partidos de fútbol 5, 7 y 11 — vos solo llevá la pelota.
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
  );
}
