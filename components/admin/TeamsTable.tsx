"use client";

import { useState } from "react";
import { Lock, MapPin, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TeamZoneDialog } from "@/components/admin/TeamZoneDialog";
import { cn } from "@/lib/utils";
import type { AdminTeamRow } from "@/lib/teams-data";

// Zona fija: servidor y navegador tienen que formatear igual (hidratación).
const DATE_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

const CATEGORY_LABEL: Record<string, string> = {
  HOMBRES: "Hombres",
  MUJERES: "Mujeres",
  MIXTO: "Mixto",
};

export function TeamsTable({ teams, zones }: { teams: AdminTeamRow[]; zones: string[] }) {
  const [zoneTeam, setZoneTeam] = useState<AdminTeamRow | null>(null);

  if (teams.length === 0) {
    return (
      <EmptyState
        icon={Shield}
        tone="neutral"
        title="Sin equipos"
        description="Ningún equipo coincide con la búsqueda."
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="ledger-stack w-full border-collapse text-left text-[15px] md:min-w-[820px]">
          <thead>
            <tr className="border-b border-chalk-line text-[13px] text-chalk-faint">
              <th className="px-3 py-2 font-normal">Equipo</th>
              <th className="px-3 py-2 font-normal">Zona</th>
              <th className="px-3 py-2 font-normal">Categoría</th>
              <th className="px-3 py-2 font-normal">Miembros</th>
              <th className="px-3 py-2 font-normal">Mudanzas esta temporada</th>
              <th className="px-3 py-2"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr
                key={team.id}
                className={cn(
                  "border-b border-chalk-line",
                  !team.isActive && "opacity-60",
                )}
              >
                <td data-label="Equipo" className="px-3 py-3">
                  <div>
                    <span className="font-medium text-chalk">{team.name}</span>
                    {!team.isActive ? (
                      <span className="ml-2 text-sm text-chalk-faint">(dado de baja)</span>
                    ) : null}
                  </div>
                </td>
                <td data-label="Zona" className="px-3 py-3 text-chalk-dim">
                  <span className="inline-flex items-center gap-1.5">
                    {team.zone}
                    {team.zoneLocked ? (
                      <Lock
                        className="size-3 text-chalk-faint"
                        aria-label="Ya usó su cambio de zona de la temporada"
                      />
                    ) : null}
                  </span>
                </td>
                <td data-label="Categoría" className="px-3 py-3 text-chalk-dim">
                  {CATEGORY_LABEL[team.category] ?? team.category}
                </td>
                <td data-label="Miembros" className="px-3 py-3 tabular-nums text-chalk-dim">
                  {team.membersCount}
                </td>
                <td data-label="Mudanzas" className="px-3 py-3 text-sm text-chalk-dim">
                  {team.seasonChanges.length === 0 ? (
                    "—"
                  ) : (
                    <ul className="flex flex-col gap-0.5">
                      {team.seasonChanges.map((change) => (
                        <li key={change.createdAt} title={change.reason ?? undefined}>
                          {DATE_FORMATTER.format(new Date(change.createdAt))}: {change.fromZone} →{" "}
                          {change.toZone}
                          {change.isAdminOverride ? (
                            <span className="ml-1 font-medium text-chalk">(admin)</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="px-3 py-3 md:text-right">
                  <Button variant="outline" size="sm" onClick={() => setZoneTeam(team)}>
                    <MapPin className="size-3.5" aria-hidden="true" />
                    Cambiar zona
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TeamZoneDialog
        team={zoneTeam}
        zones={zones}
        onOpenChange={(open) => !open && setZoneTeam(null)}
      />
    </>
  );
}
