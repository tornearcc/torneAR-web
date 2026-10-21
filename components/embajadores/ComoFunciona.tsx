"use client";

import { useRef, useState } from "react";
import { EarningsMock, ShareMock, SignupMock } from "./StepMocks";

/*
 * Mobile: carrusel horizontal con scroll-snap (un paso a la vez, el siguiente
 * asoma para invitar a deslizar) y puntos «1 / 3». Desktop: tres columnas.
 * Capturas reales: ver el comentario de StepMocks.tsx (pasar `screenshotSrc`).
 */

const STEPS = [
  {
    n: 1,
    title: "Anotate en la app con tu Instagram",
    line: "Un minuto y quedás adentro. Lo hacés desde Perfil → Embajadores.",
    Mock: SignupMock,
    alt: "Formulario para ser embajador en la app",
    description:
      "Pantalla de la app, en Perfil, Embajadores: campo de Instagram, casillas «Soy mayor de 18» y «Leí y acepto las bases» y el botón verde «Quiero ser embajador».",
  },
  {
    n: 2,
    title: "Pasale tu link a otros equipos",
    line: "Compartilo por WhatsApp. Ellos ponen tu usuario cuando crean el equipo.",
    Mock: ShareMock,
    alt: "Tarjeta para invitar a un equipo y mensaje de WhatsApp con tu link",
    description:
      "Tarjeta «Invitá a un equipo» y un mensaje de WhatsApp: «Creá tu equipo y en ¿Quién los invitó? poné mi usuario jose», con el link tornear.vercel.app/i/jose?emb=1.",
  },
  {
    n: 3,
    title: "Cuando juegan su primer partido, cobrás $5.000 por cada uno",
    line: "Te avisamos al instante y lo ves sumado en tus ganancias.",
    Mock: EarningsMock,
    alt: "Notificación de que sumaste $5.000 y panel de ganancias",
    description:
      "Notificación «¡Sumaste $5.000! Rimini CF jugó su primer partido en TorneAR» sobre el panel: Ganado $5.000, Pagado $0, 1 de 5 equipos para el bono.",
  },
];

export function ComoFunciona() {
  const scroller = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);

  function onScroll() {
    const el = scroller.current;
    const slide = el?.children[0] as HTMLElement | undefined;
    if (!el || !slide) return;
    const step = slide.offsetWidth + 16;
    setActive(Math.min(STEPS.length - 1, Math.max(0, Math.round(el.scrollLeft / step))));
  }

  function goTo(i: number) {
    const el = scroller.current;
    const slide = el?.children[i] as HTMLElement | undefined;
    if (!el || !slide) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: slide.offsetLeft - el.offsetLeft, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <div className="mt-6">
      <ol
        ref={scroller}
        onScroll={onScroll}
        tabIndex={0}
        aria-label="Pasos para ser embajador"
        className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-8 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {STEPS.map((s) => (
          <li key={s.n} className="w-[82%] shrink-0 snap-center flex-col sm:w-[60%] lg:w-auto flex">
            <div className="flex items-start gap-3">
              <span className="font-display text-5xl leading-[0.85] font-extrabold text-brand-primary">{s.n}</span>
              <div>
                <h3 className="text-lg leading-snug font-bold text-neutral-on-surface">{s.title}</h3>
                <p className="mt-1 text-[0.95rem] text-neutral-on-surface-variant">{s.line}</p>
              </div>
            </div>
            <div className="mt-auto pt-5">
              <s.Mock alt={s.alt} description={s.description} />
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex items-center justify-center gap-3 lg:hidden">
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <button
              key={s.n}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ir al paso ${s.n}`}
              aria-current={active === i}
              className="flex size-6 items-center justify-center"
            >
              <span
                className={`h-2 rounded-full transition-all motion-reduce:transition-none ${
                  active === i ? "w-6 bg-brand-primary" : "w-2 bg-surface-variant"
                }`}
              />
            </button>
          ))}
        </div>
        <span aria-hidden="true" className="text-sm text-neutral-outline tabular-nums">
          {active + 1} / {STEPS.length}
        </span>
      </div>
    </div>
  );
}
