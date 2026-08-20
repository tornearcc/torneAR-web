import { createClient } from "@/lib/supabase/server";
import { buildDisputeScoreboard, type CanonicalScoreline } from "@/lib/dispute-scores";
import { fetchOverviewKpis } from "@/lib/analytics-data";
import type { Database } from "@/types/supabase";

/**
 * Lecturas de los tres módulos de gestión migrados de la app móvil
 * (`tornear/app/admin/{season,wo-review,dispute-review}.tsx`).
 *
 * Toda la lógica ya vive en Postgres: `transition_season`, `resolve_wo_claim`
 * y `admin_resolve_dispute` son RPCs `SECURITY DEFINER` que validan `is_admin`
 * puertas adentro. Acá sólo se llaman y se mapean a los tipos que consume la
 * UI — el mismo mapeo que hacen `tornear/lib/{season,wo,dispute}-admin-data.ts`,
 * a propósito, para que las dos superficies muestren lo mismo.
 */

// ─── Temporadas ──────────────────────────────────────────────────────────────

export interface ActiveSeasonInfo {
  id: string;
  name: string;
  startsAt: string; // YYYY-MM-DD
  endsAt: string; // YYYY-MM-DD
  /** true si ends_at ya pasó: la transición está pendiente. */
  isExpired: boolean;
}

export type SeasonRow = Pick<
  Database["public"]["Tables"]["seasons"]["Row"],
  "id" | "name" | "starts_at" | "ends_at" | "is_active"
>;

export interface SeasonsSnapshot {
  active: ActiveSeasonInfo | null;
  /** Todas las temporadas, la más reciente primero. */
  history: SeasonRow[];
  error: string | null;
}

export async function fetchSeasons(): Promise<SeasonsSnapshot> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("seasons")
    .select("id, name, starts_at, ends_at, is_active")
    .order("starts_at", { ascending: false });

  if (error) return { active: null, history: [], error: error.message };

  const activeRow = (data ?? []).find((s) => s.is_active) ?? null;

  return {
    active: activeRow
      ? {
          id: activeRow.id,
          name: activeRow.name,
          startsAt: activeRow.starts_at,
          endsAt: activeRow.ends_at,
          // Mismo criterio que tornear/lib/season-admin-data.ts: vencida
          // recién al terminar el día de ends_at, no al empezarlo.
          isExpired: new Date(`${activeRow.ends_at}T23:59:59`) < new Date(),
        }
      : null,
    history: data ?? [],
    error: null,
  };
}

// ─── Reclamos de WO ──────────────────────────────────────────────────────────

/** Goleador propuesto, enriquecido con nombre por la RPC. */
export type WoScorer = {
  profile_id: string;
  goals: number;
  full_name: string | null;
};

export interface PendingWoClaim {
  claimId: string;
  matchId: string;
  createdAt: string;
  scheduledAt: string | null;
  reason: string | null;
  /** Path dentro del bucket `wo_evidences`, o una URL absoluta ya resuelta. */
  photoUrl: string | null;
  claimingTeamId: string;
  claimingTeamName: string;
  opponentTeamName: string;
  scorers: WoScorer[];
  mvpId: string | null;
  mvpName: string | null;
}

export interface WoClaimsSnapshot {
  claims: PendingWoClaim[];
  error: string | null;
}

export async function fetchPendingWoClaims(): Promise<WoClaimsSnapshot> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_pending_wo_claims");
  if (error) return { claims: [], error: error.message };

  return {
    // La RPC puede devolver null en los campos opcionales aunque el tipo
    // generado no lo exprese (limitación de RETURNS TABLE) — los tipos de
    // arriba sí los modelan como nullables.
    claims: (data ?? []).map((r) => ({
      claimId: r.claim_id,
      matchId: r.match_id,
      createdAt: r.created_at,
      scheduledAt: r.scheduled_at,
      reason: r.reason,
      photoUrl: r.photo_url,
      claimingTeamId: r.claiming_team_id,
      claimingTeamName: r.claiming_team_name,
      opponentTeamName: r.opponent_team_name,
      scorers: (r.scorers as WoScorer[] | null) ?? [],
      mvpId: r.mvp_id,
      mvpName: r.mvp_name,
    })),
    error: null,
  };
}

/**
 * URL pública de una evidencia de WO.
 *
 * El bucket `wo_evidences` es público (`storage.buckets.public = true`), así
 * que la URL se arma sin firmar y sin red — `getPublicUrl` es construcción de
 * string. Las policies de SELECT sobre `storage.objects` restringen la lectura
 * a la evidencia propia vía la Storage API, pero el path `/object/public/` no
 * pasa por RLS; por eso el admin puede ver la foto de un reclamo ajeno. Es el
 * mismo camino que usa la app móvil (`getSupabaseStorageUrl`).
 */
export async function resolveWoEvidenceUrl(photoPath: string | null): Promise<string | null> {
  if (!photoPath) return null;
  if (photoPath.startsWith("http")) return photoPath;

  const supabase = await createClient();
  const { data } = supabase.storage.from("wo_evidences").getPublicUrl(photoPath);
  return data?.publicUrl || null;
}

// ─── Disputas ────────────────────────────────────────────────────────────────

export type DisputeResolution = "WIN_A" | "WIN_B" | "CANCEL";

export interface DisputedMatchSide {
  teamId: string;
  teamName: string;
  /**
   * El marcador COMPLETO que propuso este equipo, reescrito siempre como
   * "equipo A – equipo B" (ver lib/dispute-scores).
   *
   * Los goles sueltos no alcanzan para decidir: son los que cada equipo se
   * adjudica, de dos planillas distintas. Puestos uno al lado del otro parecen
   * un marcador y no lo son. `null` = ese equipo nunca cargó.
   */
  scoreline: CanonicalScoreline | null;
  fairPlayScore: number;
  votes: number;
}

export interface DisputedMatch {
  matchId: string;
  scheduledAt: string | null;
  matchType: "RANKING" | "AMISTOSO";
  format: string | null;
  teamA: DisputedMatchSide;
  teamB: DisputedMatchSide;
  /**
   * true cuando la resolución automática no puede desempatar: mismos votos y
   * mismo Fair Play. Es el escenario exacto que dejaba el partido colgado para
   * siempre, y el que justifica que exista esta pantalla.
   */
  isDeadlocked: boolean;
}

export interface DisputesSnapshot {
  matches: DisputedMatch[];
  error: string | null;
}

export async function fetchDisputedMatches(): Promise<DisputesSnapshot> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_disputed_matches");
  if (error) return { matches: [], error: error.message };

  const matches = (data ?? []).map((r) => {
    const votesA = Number(r.team_a_votes);
    const votesB = Number(r.team_b_votes);
    const fpsA = Number(r.team_a_fps);
    const fpsB = Number(r.team_b_fps);

    // Misma normalización que la pantalla del jugador: el admin y el equipo
    // tienen que estar mirando exactamente el mismo par de marcadores.
    const board = buildDisputeScoreboard({
      teamAId: r.team_a_id,
      teamAName: r.team_a_name,
      teamBId: r.team_b_id,
      teamBName: r.team_b_name,
      scoreByTeamA:
        r.team_a_goals === null || r.team_a_goals_against === null
          ? null
          : { goalsScored: r.team_a_goals, goalsAgainst: r.team_a_goals_against },
      scoreByTeamB:
        r.team_b_goals === null || r.team_b_goals_against === null
          ? null
          : { goalsScored: r.team_b_goals, goalsAgainst: r.team_b_goals_against },
    });

    return {
      matchId: r.match_id,
      scheduledAt: r.scheduled_at,
      matchType: r.match_type,
      format: r.format,
      teamA: {
        teamId: r.team_a_id,
        teamName: r.team_a_name,
        scoreline: board.teamA.scoreline,
        fairPlayScore: fpsA,
        votes: votesA,
      },
      teamB: {
        teamId: r.team_b_id,
        teamName: r.team_b_name,
        scoreline: board.teamB.scoreline,
        fairPlayScore: fpsB,
        votes: votesB,
      },
      isDeadlocked: votesA === votesB && fpsA === fpsB,
    } satisfies DisputedMatch;
  });

  return { matches, error: null };
}

// ─── Contadores para los badges del sidebar ──────────────────────────────────

export interface QueueCounts {
  woClaims: number;
  disputes: number;
  reports: number;
}

/**
 * Pendientes de cada cola, para los badges de navegación del sidebar.
 *
 * Se apoya en `dashboard_overview_kpis()`, que ya devuelve los tres números
 * agregados en Postgres. La primera versión de esta función llamaba a las dos
 * RPCs de cola y contaba las filas en JS, porque no existía una RPC de conteo;
 * ahora que existe, tres consultas se volvieron una — y como `fetchOverviewKpis`
 * está cacheada por request, el layout y la página de Resumen comparten la
 * misma llamada en vez de duplicarla.
 *
 * Nunca tira: un badge es información accesoria y no puede voltear el layout
 * entero del dashboard. Ante un error, los contadores quedan en 0 y los badges
 * simplemente no se muestran.
 */
export async function fetchQueueCounts(): Promise<QueueCounts> {
  const { data } = await fetchOverviewKpis();

  return {
    woClaims: data?.wo_claims_pending ?? 0,
    disputes: data?.disputes_pending ?? 0,
    reports: data?.reports_pending ?? 0,
  };
}
