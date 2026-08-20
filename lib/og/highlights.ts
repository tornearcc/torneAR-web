import { createClient } from "@/lib/supabase/route-handler";

/**
 * Lectura de `content_weekly_highlights` para el Content Factory.
 *
 * Va por `lib/supabase/route-handler` y no por `lib/supabase/server`: este
 * módulo sólo lo consume `app/api/og/[template]/route.tsx`, que es un Route
 * Handler — mismo cliente que usan las Server Actions, por la misma razón
 * (acá sí está permitido escribir cookies sin el try/catch silencioso).
 */

export interface HighlightPerson {
  profile_id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

export interface MvpHighlight extends HighlightPerson {
  votes: number;
}

export interface TopScorerHighlight extends HighlightPerson {
  goals: number;
  /** En cuántos partidos distintos anotó esos goles. */
  matches: number;
}

export interface EloJumpHighlight {
  team_id: string;
  team_name: string;
  shield_url: string | null;
  delta: number;
  elo_before: number;
  elo_after: number;
}

/** Un lado de `EpicMatchHighlight`, ya orientado al equipo A o B del partido. */
export interface EpicMatchSide {
  team_id: string;
  team_name: string;
  shield_url: string | null;
  goals: number;
}

export interface EpicMatchHighlight {
  match_id: string;
  /** `matches.finished_at` — timestamptz ISO, no una fecha suelta. */
  played_at: string;
  match_type: string;
  /** `matches.format` es nullable en la base (partidos viejos sin formato). */
  format: string | null;
  total_goals: number;
  team_a: EpicMatchSide;
  team_b: EpicMatchSide;
}

export interface ZoneLeaderTeam {
  /** 1..5, ya calculada por la RPC — la tarjeta no vuelve a numerar. */
  position: number;
  team_id: string;
  team_name: string;
  shield_url: string | null;
  elo: number;
  wins: number;
  draws: number;
  losses: number;
}

export interface ZoneLeadersHighlight {
  zone: string;
  /** Partidos asentados de la zona en la ventana: es POR QUÉ salió elegida. */
  matches_played: number;
  teams: ZoneLeaderTeam[];
}

export interface WeeklyHighlights {
  from: string;
  to: string;
  mvp: MvpHighlight | null;
  elo_jump: EloJumpHighlight | null;
  top_scorer: TopScorerHighlight | null;
  epic_match: EpicMatchHighlight | null;
  zone_leaders: ZoneLeadersHighlight | null;
}

export interface HighlightsResult {
  data: WeeklyHighlights | null;
  error: string | null;
}

export async function fetchWeeklyHighlights(
  from: string | null,
  to: string | null,
): Promise<HighlightsResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("content_weekly_highlights", {
    p_from: from ?? undefined,
    p_to: to ?? undefined,
  });

  if (error) {
    console.error("[og/highlights] content_weekly_highlights falló:", error.message);
    return { data: null, error: error.message };
  }

  // La RPC devuelve `jsonb`, así que Supabase-js lo tipa como `Json`
  // genérico. El shape real lo definen las migraciones 20260819210000 y
  // 20260820000000 (`content_expansion`); se castea acá una sola vez para
  // que el resto del módulo trabaje tipado.
  return { data: data as unknown as WeeklyHighlights, error: null };
}
