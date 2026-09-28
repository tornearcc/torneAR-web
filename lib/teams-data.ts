import { createClient } from "@/lib/supabase/server";

/**
 * Listado de equipos para /dashboard/teams (D-55, candado de zona).
 *
 * Tres lecturas con la sesión del admin: `teams` (SELECT abierto), la
 * temporada activa y sus mudanzas en `team_zone_changes` (RLS: sólo admins).
 * El volumen es chico (decenas de equipos), así que se trae todo y se cruza
 * acá; si crece, pasa a una RPC `dashboard_*` como la de usuarios.
 */

export interface TeamZoneChangeSummary {
  fromZone: string;
  toZone: string;
  createdAt: string;
  isAdminOverride: boolean;
  reason: string | null;
}

export interface AdminTeamRow {
  id: string;
  name: string;
  zone: string;
  category: string;
  preferredFormat: string;
  isActive: boolean;
  membersCount: number;
  /** El equipo ya usó su cambio de zona de la temporada activa (desde la app). */
  zoneLocked: boolean;
  /** Mudanzas de la temporada activa, la más reciente primero. */
  seasonChanges: TeamZoneChangeSummary[];
}

export interface TeamsPage {
  rows: AdminTeamRow[];
  seasonName: string | null;
  zones: string[];
  error: string | null;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function resolveTeamSearch(params: { [key: string]: string | string[] | undefined }): string {
  return (firstParam(params.q) ?? "").trim().slice(0, 100);
}

export async function fetchTeamsPage(search: string): Promise<TeamsPage> {
  const supabase = await createClient();

  let teamsQuery = supabase
    .from("teams")
    .select("id, name, zone, category, preferred_format, is_active, team_members(count)")
    .order("name");
  if (search) teamsQuery = teamsQuery.ilike("name", `%${search}%`);

  const [teamsRes, seasonRes, zonesRes] = await Promise.all([
    teamsQuery,
    supabase
      .from("seasons")
      .select("id, name")
      .eq("is_active", true)
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("zones").select("name").order("name"),
  ]);

  const error = teamsRes.error?.message ?? seasonRes.error?.message ?? zonesRes.error?.message ?? null;
  if (error) return { rows: [], seasonName: null, zones: [], error };

  const season = seasonRes.data;
  const changesByTeam = new Map<string, TeamZoneChangeSummary[]>();

  if (season) {
    const { data: changes, error: changesError } = await supabase
      .from("team_zone_changes")
      .select("team_id, from_zone, to_zone, created_at, is_admin_override, reason")
      .eq("season_id", season.id)
      .order("created_at", { ascending: false });
    if (changesError) return { rows: [], seasonName: null, zones: [], error: changesError.message };

    for (const change of changes ?? []) {
      const list = changesByTeam.get(change.team_id) ?? [];
      list.push({
        fromZone: change.from_zone,
        toZone: change.to_zone,
        createdAt: change.created_at,
        isAdminOverride: change.is_admin_override,
        reason: change.reason,
      });
      changesByTeam.set(change.team_id, list);
    }
  }

  const rows: AdminTeamRow[] = (teamsRes.data ?? []).map((team) => {
    const seasonChanges = changesByTeam.get(team.id) ?? [];
    const members = team.team_members as unknown as { count: number }[] | null;
    return {
      id: team.id,
      name: team.name,
      zone: team.zone,
      category: team.category,
      preferredFormat: team.preferred_format,
      isActive: team.is_active,
      membersCount: members?.[0]?.count ?? 0,
      zoneLocked: seasonChanges.some((c) => !c.isAdminOverride),
      seasonChanges,
    };
  });

  return {
    rows,
    seasonName: season?.name ?? null,
    zones: (zonesRes.data ?? []).map((z) => z.name),
    error: null,
  };
}
