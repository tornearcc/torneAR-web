"use client";

import { useState } from "react";

const PER_TEAM = 5000;
const BONUS = 5000;
const DEBUT = 5000;

const money = (n: number) => `$${n.toLocaleString("es-AR")}`;

/**
 * Calculadora de ganancias: total = 5000·n + debut + bono de 5 + bono de 10.
 * Mismas reglas que las bases (/legal/embajadores): el debut sólo vale si el
 * primer partido del equipo propio es contra uno de los equipos traídos.
 */
export function EarningsCalculator() {
  const [teams, setTeams] = useState(3);
  const [debut, setDebut] = useState(false);

  const lines = [
    {
      label: `${teams} ${teams === 1 ? "equipo traído" : "equipos traídos"} × ${money(PER_TEAM)}`,
      amount: PER_TEAM * teams,
    },
    ...(debut ? [{ label: "Extra de debut", amount: DEBUT }] : []),
    ...(teams >= 5 ? [{ label: "Bono por llegar a 5 equipos", amount: BONUS }] : []),
    ...(teams >= 10 ? [{ label: "Bono por llegar a 10 equipos", amount: BONUS }] : []),
  ];
  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  const fill = ((teams - 1) / 19) * 100;

  return (
    <div className="rounded-2xl border border-neutral-outline-variant bg-surface-container p-5 sm:p-8">
      <label htmlFor="teams" className="flex items-baseline justify-between gap-3">
        <span className="font-bold text-neutral-on-surface">Equipos que traés</span>
        <span className="font-display text-4xl leading-none font-extrabold text-brand-primary tabular-nums">{teams}</span>
      </label>
      <input
        id="teams"
        type="range"
        min={1}
        max={20}
        step={1}
        value={teams}
        onChange={(e) => setTeams(Number(e.target.value))}
        style={{ background: `linear-gradient(to right, var(--brand-primary) ${fill}%, var(--surface-variant) ${fill}%)` }}
        className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full accent-brand-primary [&::-moz-range-thumb]:size-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-brand-primary [&::-webkit-slider-thumb]:size-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-primary [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(83,224,118,0.25)]"
      />
      <div aria-hidden="true" className="mt-2 flex justify-between text-xs text-neutral-outline">
        <span>1</span>
        <span>5</span>
        <span>10</span>
        <span>20</span>
      </div>

      <label className="mt-6 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-neutral-outline-variant bg-surface-low p-4">
        <span className="text-neutral-on-surface">Mi equipo debuta contra uno de ellos</span>
        <input
          type="checkbox"
          role="switch"
          checked={debut}
          onChange={(e) => setDebut(e.target.checked)}
          className="relative h-7 w-12 shrink-0 cursor-pointer appearance-none rounded-full bg-surface-variant transition-colors checked:bg-brand-primary after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-neutral-on-surface after:transition-transform checked:after:translate-x-5 checked:after:bg-surface-lowest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
        />
      </label>

      <div className="mt-6 border-t-2 border-brand-primary pt-5" aria-live="polite">
        <p className="text-sm text-neutral-on-surface-variant">Ganás en total</p>
        <p className="font-display text-6xl leading-none font-extrabold text-brand-gold tabular-nums sm:text-7xl">
          {money(total)}
        </p>
        <ul className="mt-4 divide-y divide-neutral-outline-variant/60 text-sm">
          {lines.map((l) => (
            <li key={l.label} className="flex justify-between gap-4 py-2">
              <span className="text-neutral-on-surface-variant">{l.label}</span>
              <span className="font-bold text-neutral-on-surface tabular-nums">{money(l.amount)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-neutral-outline">
          Cuentan sólo los equipos traídos que ya jugaron un partido válido. El extra de debut se paga si el primer
          partido válido de tu equipo es contra un equipo que trajiste vos.
        </p>
      </div>
    </div>
  );
}
