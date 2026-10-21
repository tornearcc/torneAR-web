const FORMATS = [
  { name: "Fútbol 5", min: 5 },
  { name: "Fútbol 6", min: 6 },
  { name: "Fútbol 7", min: 7 },
  { name: "Fútbol 8", min: 8 },
  { name: "Fútbol 9", min: 9 },
  { name: "Fútbol 11", min: 11 },
];

export function MinimumsTable() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <h3 className="font-display text-2xl font-bold text-neutral-on-surface uppercase">Qué es un partido válido</h3>
        <ul className="mt-4 flex flex-col gap-3 text-neutral-on-surface-variant">
          <li className="flex gap-3">
            <Check />
            El partido terminó y tiene el resultado cargado.
          </li>
          <li className="flex gap-3">
            <Check />
            Los dos equipos hicieron check-in en la cancha.
          </li>
          <li className="flex gap-3">
            <Check />
            Los dos equipos tienen al menos los titulares del formato, cada uno con su propia cuenta y como integrante
            del equipo cuando termina el partido.
          </li>
        </ul>
        <p className="mt-4 rounded-xl border border-brand-gold/40 bg-brand-gold/10 p-4 text-neutral-on-surface">
          Cada jugador cuenta para un solo equipo por embajador: no sirve armar varios equipos con los mismos amigos, ni
          contar a tu propio equipo.
        </p>
      </div>
      <table className="w-full self-start border-collapse text-left">
        <caption className="sr-only">Jugadores mínimos por equipo según el formato</caption>
        <thead>
          <tr className="border-b-2 border-brand-primary text-sm text-neutral-outline">
            <th scope="col" className="py-2 font-medium">
              Formato
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              Mínimo por equipo
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-outline-variant">
          {FORMATS.map((f) => (
            <tr key={f.name}>
              <th scope="row" className="py-3 font-bold text-neutral-on-surface">
                {f.name}
              </th>
              <td className="font-display py-3 text-right text-2xl font-extrabold text-brand-primary">{f.min}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Check() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-1 size-4 shrink-0 text-brand-primary"
    >
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}
