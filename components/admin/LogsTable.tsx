"use client";

import { useState } from "react";
import { ChevronRight, Inbox } from "lucide-react";

import { cn } from "@/lib/utils";
import type { LogRow } from "@/lib/logs-data";

// `level` es un CHECK, no un enum de Postgres — el generador de tipos lo deja
// como `string` plano. El fallback a "info" cubre cualquier valor futuro que
// no esté en este mapa en vez de romper el render.
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

/**
 * Tabla del explorador de logs.
 *
 * Sólo recibe la página ya filtrada y ordenada por el servidor: no filtra ni
 * ordena nada. La versión anterior recibía 100 filas fijas y las filtraba en
 * el cliente por substring, lo que hacía que el buscador mintiera — decía
 * "3 de 100" cuando la tabla tenía 928 filas y las otras 828 nunca se habían
 * mirado.
 *
 * Lo único que sigue siendo estado de cliente es qué fila está expandida.
 */
export function LogsTable({ rows }: { rows: LogRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-outline-variant bg-surface-container px-6 py-16 text-center">
        <Inbox className="size-8 text-neutral-outline" aria-hidden="true" />
        <p className="text-sm text-neutral-on-surface-variant">
          Ningún log coincide con estos filtros.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-outline-variant">
      <table className="w-full min-w-[860px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-outline-variant bg-surface-container text-neutral-on-surface-variant">
            <th className="w-8 px-2 py-2" />
            <th className="px-3 py-2 font-medium">Fecha</th>
            <th className="px-3 py-2 font-medium">Nivel</th>
            <th className="px-3 py-2 font-medium">Usuario</th>
            <th className="px-3 py-2 font-medium">Mensaje</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((log) => {
            const isExpanded = expandedId === log.id;
            const hasDetails = log.details !== null && log.details !== undefined;

            return [
              <tr
                key={log.id}
                onClick={() => hasDetails && setExpandedId(isExpanded ? null : log.id)}
                className={cn(
                  "border-b border-neutral-outline-variant last:border-0",
                  hasDetails && "cursor-pointer hover:bg-surface-container",
                  isExpanded && "bg-surface-container",
                )}
              >
                <td className="px-2 py-2">
                  {hasDetails ? (
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? "Ocultar detalles" : "Ver detalles"}
                      onClick={(event) => {
                        // El <tr> ya maneja el click; sin esto se dispararía
                        // dos veces y la fila se abriría y cerraría sola.
                        event.stopPropagation();
                        setExpandedId(isExpanded ? null : log.id);
                      }}
                      className="rounded p-0.5 text-neutral-outline transition-colors hover:text-neutral-on-surface"
                    >
                      <ChevronRight
                        className={cn(
                          "size-4 transition-transform duration-200",
                          isExpanded && "rotate-90",
                        )}
                        aria-hidden="true"
                      />
                    </button>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-neutral-on-surface-variant">
                  {DATE_FORMATTER.format(new Date(log.created_at))}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase",
                      LEVEL_BADGE_CLASS[log.level] ?? LEVEL_BADGE_CLASS.info,
                    )}
                  >
                    {log.level}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-xs text-neutral-on-surface-variant">
                  {log.user_id ? `${log.user_id.slice(0, 8)}…` : "—"}
                </td>
                <td className="px-3 py-2 text-neutral-on-surface">{log.message}</td>
              </tr>,

              // El JSON completo en una fila propia a todo el ancho. Antes
              // vivía truncado en un `title=`, o sea: sólo se podía leer al
              // pasar el mouse, no se podía copiar y se cortaba sin aviso.
              isExpanded && hasDetails ? (
                <tr key={`${log.id}-details`} className="border-b border-neutral-outline-variant">
                  <td colSpan={5} className="bg-surface-low px-4 py-3">
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-outline">
                      Detalles
                    </p>
                    <pre className="max-h-80 overflow-auto rounded-md bg-surface-lowest p-3 font-mono text-xs leading-relaxed text-neutral-on-surface-variant">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </td>
                </tr>
              ) : null,
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}
