"use client";

import { useState } from "react";
import { Lock, MapPin, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TeamZoneDialog } from "@/components/admin/TeamZoneDialog";
import { cn } from "@/lib/utils";
import type { AdminTeamRow } from "@/lib/teams-data";

const DATE_FORMATTER = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" });

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
      <div className="overflow-x-auto rounded-lg border border-neutral-outline-variant">
        <table className="w-full min-w-[820px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-outline-variant bg-surface-container text-neutral-on-surface-variant">
              <th className="px-4 py-3 font-medium">Equipo</th>
              <th className="px-4 py-3 font-medium">Zona</th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 font-medium">Miembros</th>
              <th className="px-4 py-3 font-medium">Mudanzas esta temporada</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr
                key={team.id}
                className={cn(
                  "border-b border-neutral-outline-variant last:border-0",
                  !team.isActive && "opacity-60",
                )}
              >
                <td className="px-4 py-3">
                  <span className="font-medium text-neutral-on-surface">{team.name}</span>
                  {!team.isActive ? (
                    <span className="ml-2 text-xs text-neutral-outline">(dado de baja)</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-neutral-on-surface-variant">
                  <span className="inline-flex items-center gap-1.5">
                    {team.zone}
                    {team.zoneLocked ? (
                      <Lock
                        className="size-3 text-warning-tertiary"
                        aria-label="Ya usó su cambio de zona de la temporada"
                      />
                    ) : null}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-on-surface-variant">
                  {CATEGORY_LABEL[team.category] ?? team.category}
                </td>
                <td className="px-4 py-3 tabular-nums text-neutral-on-surface-variant">
                  {team.membersCount}
                </td>
                <td className="px-4 py-3 text-xs text-neutral-on-surface-variant">
                  {team.seasonChanges.length === 0 ? (
                    "—"
                  ) : (
                    <ul className="flex flex-col gap-0.5">
                      {team.seasonChanges.map((change) => (
                        <li key={change.createdAt} title={change.reason ?? undefined}>
                          {DATE_FORMATTER.format(new Date(change.createdAt))}: {change.fromZone} →{" "}
                          {change.toZone}
                          {change.isAdminOverride ? (
                            <span className="ml-1 font-semibold text-brand-primary">(admin)</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
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
