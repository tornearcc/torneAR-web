"use client";

import { useEffect, useState } from "react";

type BoardRow = { username: string; avatar_url: string | null; teams: number; earned: number };
type Board = { enabled: boolean; slots_total: number; slots_used: number; ranking: BoardRow[] };

const money = (n: number) => `$${n.toLocaleString("es-AR")}`;

/** Ranking público: sólo embajadores que eligieron aparecer (lo resuelve la RPC). */
export function AmbassadorBoard() {
  const [board, setBoard] = useState<Board | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/embajadores/tablero")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("tablero"))))
      .then((data: Board) => {
        if (!cancelled) setBoard(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return <p className="text-neutral-on-surface-variant">No pudimos cargar el ranking. Probá de nuevo en un rato.</p>;
  }
  if (!board) {
    return <div aria-busy="true" className="h-40 animate-pulse rounded-xl bg-surface-container" />;
  }
  if (!board.enabled) {
    return (
      <p className="rounded-xl border border-dashed border-neutral-outline-variant p-6 text-lg text-neutral-on-surface">
        El ranking aparece cuando arranque el programa.
      </p>
    );
  }
  if (board.ranking.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-neutral-outline-variant p-6 text-lg text-neutral-on-surface">
        Todavía nadie cobró. Podés ser el primero.
      </p>
    );
  }

  return (
    <table className="w-full border-collapse text-left">
      <caption className="sr-only">Embajadores que eligieron aparecer en el ranking</caption>
      <thead>
        <tr className="border-b-2 border-brand-primary text-sm text-neutral-outline">
          <th scope="col" className="w-10 py-2 font-medium">
            #
          </th>
          <th scope="col" className="py-2 font-medium">
            Embajador
          </th>
          <th scope="col" className="py-2 text-right font-medium">
            Equipos
          </th>
          <th scope="col" className="py-2 text-right font-medium">
            Ganó
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-neutral-outline-variant">
        {board.ranking.map((row, i) => (
          <tr key={row.username}>
            <td className="font-display py-3 text-xl font-extrabold text-brand-gold">{i + 1}</td>
            <td className="py-3">
              <span className="flex items-center gap-3">
                {row.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.avatar_url}
                    alt=""
                    width={36}
                    height={36}
                    loading="lazy"
                    className="size-9 rounded-full bg-surface-high object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex size-9 items-center justify-center rounded-full bg-surface-high font-bold text-brand-primary"
                  >
                    {row.username.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="font-bold break-all text-neutral-on-surface">{row.username}</span>
              </span>
            </td>
            <td className="py-3 text-right text-neutral-on-surface-variant tabular-nums">{row.teams}</td>
            <td className="py-3 text-right font-bold text-neutral-on-surface tabular-nums">{money(row.earned)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
