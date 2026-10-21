const ITEMS = [
  {
    q: "¿Cuándo cobro?",
    a: "Cuando un equipo que trajiste juega su primer partido válido, te avisamos en la app. Si todavía no cargaste tu alias o CBU, te lo pedimos ahí. Verificamos que nos seguís en Instagram y te transferimos dentro de los 7 días.",
  },
  {
    q: "¿Tengo que jugar en los equipos que traigo?",
    a: "No. Alcanza con que los traigas y que jueguen su primer partido válido contra cualquier equipo de la app. De hecho, si estás en el plantel del equipo cuando juega, ese equipo no genera premio.",
  },
  {
    q: "¿Necesito tener equipo?",
    a: "No. Tener equipo propio sólo hace falta para el extra de debut. Se asigna solo: si estás en un equipo, ese; si todavía no tenés, el primero que armes o al que te sumes.",
  },
  {
    q: "¿Puedo usar mis mismos jugadores?",
    a: "No. Cada jugador cuenta para un solo equipo por embajador: no suman para un equipo traído ni vos, ni los de tu equipo propio, ni los que ya contaron para otro equipo que trajiste. Si sin ellos no llega al mínimo, ese partido no paga, pero puede pagar uno posterior.",
  },
  {
    q: "¿Qué pasa si se van jugadores?",
    a: "Si el equipo ya jugó su primer partido válido, el premio ganado se mantiene aunque después alguien se vaya. Si el primer partido no fue válido (por ejemplo, eran 6 en Fútbol 7), puede cobrar con el siguiente partido válido.",
  },
  {
    q: "¿Hasta cuándo dura?",
    a: "No tiene fecha de fin: termina cuando 100 equipos traídos jugaron su primer partido válido. Los premios ya generados se pagan igual.",
  },
];

export function Faq() {
  return (
    <div className="divide-y divide-neutral-outline-variant border-y border-neutral-outline-variant">
      {ITEMS.map((item) => (
        <details key={item.q} className="group py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-neutral-on-surface focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary [&::-webkit-details-marker]:hidden">
            {item.q}
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              className="size-5 shrink-0 text-brand-primary transition-transform group-open:rotate-45"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </summary>
          <p className="mt-3 max-w-prose text-neutral-on-surface-variant">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
