"use client";

import { useMemo, useState } from "react";
import type { Database } from "@/types/supabase";

export type LogRow = Pick<
  Database["public"]["Tables"]["app_logs"]["Row"],
  "id" | "level" | "message" | "details" | "user_id" | "created_at"
>;

// `level` es un CHECK, no un enum de Postgres — el generador de tipos lo
// deja como `string` plano. El fallback a "info" cubre cualquier valor
// futuro que no esté en este mapa en vez de romper el render.
const LEVEL_BADGE_CLASS: Record<string, string> = {
  error: "bg-danger-error-container text-danger-on-error-container",
  warn: "bg-warning-tertiary-container text-warning-on-tertiary",
  info: "bg-surface-high text-neutral-on-surface-variant",
};

const DATE_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export function LogsExplorer({ logs }: { logs: LogRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((log) => log.message.toLowerCase().includes(q));
  }, [logs, query]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-lg uppercase text-neutral-on-surface">
          Explorador de logs
        </h2>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por mensaje…"
          className="w-64 rounded-md border border-neutral-outline-variant bg-surface-low px-3 py-1.5 text-sm text-neutral-on-surface outline-none focus:border-brand-primary"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-outline-variant">
        <table className="w-full min-w-[820px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-outline-variant bg-surface-container text-neutral-on-surface-variant">
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Nivel</th>
              <th className="px-3 py-2 font-medium">Usuario</th>
              <th className="px-3 py-2 font-medium">Mensaje</th>
              <th className="px-3 py-2 font-medium">Detalles</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <tr
                key={log.id}
                className="border-b border-neutral-outline-variant font-mono text-xs last:border-0"
              >
                <td className="whitespace-nowrap px-3 py-2 text-neutral-on-surface-variant">
                  {DATE_FORMATTER.format(new Date(log.created_at))}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase ${
                      LEVEL_BADGE_CLASS[log.level] ?? LEVEL_BADGE_CLASS.info
                    }`}
                  >
                    {log.level}
                  </span>
                </td>
                <td className="px-3 py-2 text-neutral-on-surface-variant">
                  {log.user_id ? `${log.user_id.slice(0, 8)}…` : "—"}
                </td>
                <td className="max-w-sm px-3 py-2 font-sans text-neutral-on-surface">
                  {log.message}
                </td>
                <td
                  className="max-w-xs truncate px-3 py-2 text-neutral-on-surface-variant"
                  title={log.details ? JSON.stringify(log.details) : undefined}
                >
                  {log.details ? JSON.stringify(log.details) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="p-6 text-center text-sm text-neutral-on-surface-variant">
            Sin resultados para “{query}”.
          </p>
        )}
      </div>

      <p className="text-xs text-neutral-on-surface-variant">
        {filtered.length} de {logs.length} logs mostrados.
      </p>
    </div>
  );
}
