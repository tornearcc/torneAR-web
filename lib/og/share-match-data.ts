import { createBearerTokenClient } from "@/lib/supabase/bearer-token";
import type { ShareMatchScorer } from "@/lib/og/templates/TemplateShareMatch";

/**
 * Datos de la tarjeta "Compartir Partido" (`/api/og/share-match?match=<uuid>`).
 *
 * Consultas directas a las tablas y no una RPC nueva: es una lectura de un
 * solo partido, sin agregaciones ni recorridas, y meterla en la base
 * significaría una migración más para mantener. La contrapartida honesta es
 * que las reglas de dominio de acá abajo (cuál marcador vale, quién es el
 * MVP) quedan duplicadas respecto de `apply_match_outcome` — están marcadas
 * una por una para que se puedan encontrar si esa función cambia.
 *
 * Corre EN NOMBRE del jugador que pide la tarjeta, con su JWT: ver
 * `lib/supabase/bearer-token.ts`. Todas las consultas de acá pasan por RLS
 * con el rol `authenticated`, así que este módulo no es una superficie
 * privilegiada — si el token no sirve, Postgres rechaza y no hay tarjeta.
 *
 * ⚠️ El MVP y los goleadores salen de `profiles_public`, NO de `profiles`.
 * El rol `authenticated` no tiene GRANT de SELECT sobre `profiles`
 * (verificado contra la base el 2026-08-21); la vista existe justamente para
 * esto y expone sólo columnas publicables. Cambiar el `from("profiles_public")`
 * por `from("profiles")` compila igual y falla en runtime con
 * "permission denied".
 */

/** Estados en los que el partido tiene un resultado publicable. */
const SHAREABLE_STATUS = "FINALIZADO";

/**
 * Cota defensiva de goleadores dibujados.
 *
 * No es un límite de diseño: `chunkScorers` en la plantilla agrega filas
 * solas y el peor caso real de producción (10 goleadores, partido
 * `395b5051` de F11) entra en dos filas — verificado renderizando. Es un
 * techo para que un dato roto no haga crecer la caja hasta empujar el footer
 * fuera de los 1920. Un F11 no puede tener más de 11 goleadores distintos,
 * así que en la práctica nunca recorta.
 */
const MAX_SCORERS = 12;

export type ShareMatchError =
  | { kind: "unauthorized"; message: string }
  | { kind: "invalid-id"; message: string }
  | { kind: "not-found"; message: string }
  | { kind: "not-shareable"; message: string }
  | { kind: "inconsistent"; message: string }
  | { kind: "query-failed"; message: string };

/**
 * Distingue "tu token no sirve" de "la consulta falló".
 *
 * `PGRST301` es lo que devuelve PostgREST con un JWT vencido o mal firmado, y
 * `42501` es el `insufficient_privilege` de Postgres. Sin esta separación,
 * una sesión vencida en el teléfono llegaría a la app como un 500 genérico y
 * el jugador vería "error del servidor" cuando lo único que necesita es que
 * la app refresque el token y reintente.
 */
function isAuthError(error: { code?: string } | null): boolean {
  return error?.code === "PGRST301" || error?.code === "42501";
}

export interface ShareMatchSide {
  name: string;
  shieldPath: string | null;
  goals: number;
}

export interface ShareMatchData {
  matchType: string;
  format: string;
  date: string;
  home: ShareMatchSide;
  away: ShareMatchSide;
  ratingChange: string | null;
  mvp: { name: string; avatarPath: string | null } | null;
  scorers: ShareMatchScorer[];
}

export type ShareMatchResult =
  | { ok: true; data: ShareMatchData }
  | { ok: false; error: ShareMatchError };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MATCH_TYPE_LABEL: Record<string, string> = {
  RANKING: "PARTIDO DE RANKING",
  AMISTOSO: "PARTIDO AMISTOSO",
};

/** `FUTBOL_5` → `FÚTBOL 5`. Distinto del `FORMAT_SHORT` (`F5`) de format.ts. */
function formatLabel(format: string | null): string {
  if (!format) return "FÚTBOL";
  const size = format.replace("FUTBOL_", "");
  return `FÚTBOL ${size}`;
}

/** `2026-08-21T16:08:50Z` → `21 DE AGOSTO DE 2026`, en hora de Argentina. */
function dateLabel(iso: string | null): string {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).formatToParts(new Date(iso));

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  // Armado a mano y no `format()` a secas: `es-AR` devuelve "21 de agosto de
  // 2026" y el `.toUpperCase()` de la plantilla lo dejaría bien, pero el
  // separador y el orden quedarían atados a la implementación de ICU del
  // runtime. Con las partes sueltas, la tarjeta se ve igual en todos lados.
  return `${get("day")} DE ${get("month").toUpperCase()} DE ${get("year")}`;
}

/**
 * `"Juan Pérez"` → `"J. PÉREZ"`.
 *
 * Los goleadores van abreviados y el MVP no: la línea de goleadores tiene que
 * meter hasta seis nombres en 880px, y el MVP tiene una caja para él solo.
 * Un nombre de una sola palabra se deja intacto — "R." no identifica a nadie.
 */
function abbreviateName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].toUpperCase();
  return `${parts[0][0].toUpperCase()}. ${parts[parts.length - 1].toUpperCase()}`;
}

export async function fetchShareMatchData(
  matchId: string | null,
  accessToken: string,
): Promise<ShareMatchResult> {
  if (!matchId || !UUID_RE.test(matchId)) {
    return {
      ok: false,
      error: { kind: "invalid-id", message: "Falta el parámetro ?match=<uuid> o no es un UUID." },
    };
  }

  const supabase = createBearerTokenClient(accessToken);

  // ── 1) El partido ───────────────────────────────────────────────────────
  // Sólo las columnas que la tarjeta dibuja o necesita para decidir: traer
  // `*` sería mandar a la imagen columnas que nadie usa (coordenadas del
  // lugar, código único, montos) sin ninguna ventaja.
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, status, match_type, format, finished_at, team_a_id, team_b_id")
    .eq("id", matchId)
    .maybeSingle();

  // La primera consulta es la que descubre un token vencido: si el JWT no
  // sirve, PostgREST rechaza acá y no tiene sentido intentar las otras cinco.
  if (isAuthError(matchError)) {
    return {
      ok: false,
      error: { kind: "unauthorized", message: "Tu sesión venció. Volvé a entrar y probá de nuevo." },
    };
  }

  if (matchError) {
    console.error("[og/share-match] matches:", matchError);
    return { ok: false, error: { kind: "query-failed", message: "No se pudo leer el partido." } };
  }

  if (!match) {
    return { ok: false, error: { kind: "not-found", message: "Ese partido no existe." } };
  }

  /**
   * Sólo FINALIZADO se comparte.
   *
   * `WO_A`/`WO_B` quedan afuera a propósito y no por olvido: el 3-0 de un
   * walkover lo sintetiza `apply_match_outcome` en memoria, no existe en
   * `match_results`, así que acá no hay marcador que leer — y un W.O. no es
   * un resultado que nadie quiera publicar en su story. `EN_DISPUTA` también
   * queda afuera: el marcador todavía no está resuelto.
   */
  if (match.status !== SHAREABLE_STATUS) {
    return {
      ok: false,
      error: {
        kind: "not-shareable",
        message: `El partido está en estado ${match.status}. Sólo se comparten los finalizados.`,
      },
    };
  }

  // ── 2) Todo lo que cuelga del partido, en paralelo ──────────────────────
  // Cuatro lecturas independientes entre sí: encadenarlas cuadruplicaría la
  // latencia del endpoint sin ganar nada.
  const [teamsRes, resultsRes, goalsRes, eloRes] = await Promise.all([
    supabase
      .from("teams")
      .select("id, name, shield_url, preferred_format")
      .in("id", [match.team_a_id, match.team_b_id]),
    supabase
      .from("match_results")
      .select("team_id, goals_scored, goals_against, mvp_id")
      .eq("match_id", matchId),
    // El hint `!match_goals_player_id_fkey` no es opcional: `player_id` tiene
    // FK declarada contra `profiles`, `profiles_public` y `v_player_stats`, y
    // sin desambiguar, PostgREST rechaza el embed por relación ambigua. El
    // nombre de la relación destino (`profiles_public`) resuelve la otra
    // mitad: el mismo constraint apunta a la tabla y a la vista.
    supabase
      .from("match_goals")
      .select(
        "team_id, player_id, goals_count, profiles_public!match_goals_player_id_fkey(full_name)",
      )
      .eq("match_id", matchId),
    supabase.from("elo_history").select("team_id, delta").eq("match_id", matchId),
  ]);

  const failed = [teamsRes, resultsRes, goalsRes, eloRes].find((res) => res.error);
  if (failed?.error) {
    // El token puede vencer ENTRE la primera consulta y estas cuatro, así que
    // el chequeo de auth se repite acá y no sólo arriba.
    if (isAuthError(failed.error)) {
      return {
        ok: false,
        error: {
          kind: "unauthorized",
          message: "Tu sesión venció. Volvé a entrar y probá de nuevo.",
        },
      };
    }
    console.error("[og/share-match]", failed.error);
    return {
      ok: false,
      error: { kind: "query-failed", message: "No se pudieron leer los datos del partido." },
    };
  }

  const teamA = teamsRes.data?.find((team) => team.id === match.team_a_id);
  const teamB = teamsRes.data?.find((team) => team.id === match.team_b_id);
  if (!teamA || !teamB) {
    return {
      ok: false,
      error: { kind: "not-found", message: "Falta uno de los equipos del partido." },
    };
  }

  const resultA = resultsRes.data?.find((row) => row.team_id === match.team_a_id);
  const resultB = resultsRes.data?.find((row) => row.team_id === match.team_b_id);
  if (!resultA || !resultB) {
    return {
      ok: false,
      error: {
        kind: "not-shareable",
        message: "El partido está finalizado pero falta una de las planillas.",
      },
    };
  }

  /**
   * El marcador sale de `goals_scored` de cada equipo — el mismo criterio que
   * usa `apply_match_outcome` para calcular el ELO. Si acá se usara otro, la
   * tarjeta mostraría un resultado que no es el que movió el ranking.
   *
   * Cada planilla está escrita en primera persona, así que `A.goals_scored`
   * tiene que coincidir con `B.goals_against` y viceversa. Cuando no
   * coinciden, el partido debería estar `EN_DISPUTA`; si llegó a FINALIZADO
   * igual, es un dato roto y se corta acá. Publicar un marcador incorrecto en
   * la story de alguien es peor que no darle la imagen.
   */
  if (resultA.goals_scored !== resultB.goals_against || resultB.goals_scored !== resultA.goals_against) {
    return {
      ok: false,
      error: {
        kind: "inconsistent",
        message: "Las dos planillas del partido no coinciden. No hay un marcador que publicar.",
      },
    };
  }

  /**
   * `ratingChange`: el delta POSITIVO de `elo_history`, es decir el del
   * ganador. Sólo los partidos de RANKING generan filas ahí, así que en un
   * amistoso esto queda en `null` y la plantilla omite el pill entero.
   *
   * Se muestra un solo número y no los dos porque el pill vive centrado bajo
   * el marcador, sin lado asignado. En un empate el delta puede ser 0 o
   * negativo para ambos: ahí tampoco hay nada que celebrar y queda en `null`.
   */
  const topDelta = (eloRes.data ?? []).reduce(
    (max, row) => Math.max(max, row.delta),
    Number.NEGATIVE_INFINITY,
  );
  const ratingChange = Number.isFinite(topDelta) && topDelta > 0 ? `+${topDelta} RATING` : null;

  /**
   * MVP: el que nombró el equipo GANADOR.
   *
   * `match_results.mvp_id` es por planilla, o sea que cada equipo vota el MVP
   * de su propio lado y hay dos por partido — no existe un "MVP del partido"
   * único en la base. Elegir el del ganador es una decisión de producto, no
   * un dato: si mañana se quiere el del local, o los dos, se cambia acá.
   * Empate o ganador sin MVP cargado: cae al otro lado antes de rendirse.
   */
  const winnerResult =
    resultA.goals_scored > resultB.goals_scored
      ? resultA
      : resultB.goals_scored > resultA.goals_scored
        ? resultB
        : resultA;
  const loserResult = winnerResult === resultA ? resultB : resultA;
  const mvpId = winnerResult.mvp_id ?? loserResult.mvp_id;

  let mvp: ShareMatchData["mvp"] = null;
  if (mvpId) {
    const { data: mvpProfile, error: mvpError } = await supabase
      .from("profiles_public")
      .select("full_name, avatar_url")
      .eq("id", mvpId)
      .maybeSingle();

    // Un MVP que no resuelve no invalida la tarjeta: la plantilla omite la
    // caja y el resto del partido se publica igual.
    if (mvpError) console.error("[og/share-match] profiles_public(mvp):", mvpError);
    // `full_name` es nullable en la vista (todas sus columnas lo son, es una
    // vista sin NOT NULL declarados) aunque en la tabla no lo sea. Sin este
    // chequeo, un MVP fantasma dibujaría la caja con el nombre vacío.
    if (mvpProfile?.full_name) {
      mvp = { name: mvpProfile.full_name, avatarPath: mvpProfile.avatar_url };
    }
  }

  /**
   * Goleadores desde `match_goals` y no desde `match_results.scorers`: el
   * jsonb es lo que cargó el usuario y `match_goals` es su proyección ya
   * validada por el trigger `sync_match_goals_from_result` (descarta entradas
   * sin `profile_id` válido y colapsa al mismo jugador repetido). Es la misma
   * tabla que lee `content_weekly_highlights`.
   *
   * Orden: más goles primero, y el nombre como desempate — igual que la RPC
   * `get_match_scorers`. Sin el segundo criterio, dos jugadores con la misma
   * cantidad pueden salir en distinto orden entre dos requests y la tarjeta
   * "cambia" sin que haya cambiado nada.
   */
  const scorers: ShareMatchScorer[] = (goalsRes.data ?? [])
    .map((row) => ({
      name: abbreviateName(row.profiles_public?.full_name ?? ""),
      goals: row.goals_count,
    }))
    .filter((scorer) => scorer.name.length > 0)
    .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name, "es"))
    .slice(0, MAX_SCORERS);

  return {
    ok: true,
    data: {
      matchType: MATCH_TYPE_LABEL[match.match_type] ?? "PARTIDO",
      // `matches.format` es nullable para partidos viejos; el fallback al
      // formato preferido del equipo A es el mismo que hace
      // `apply_match_outcome` cuando resuelve el formato del partido.
      format: formatLabel(match.format ?? teamA.preferred_format),
      date: dateLabel(match.finished_at),
      home: { name: teamA.name, shieldPath: teamA.shield_url, goals: resultA.goals_scored },
      away: { name: teamB.name, shieldPath: teamB.shield_url, goals: resultB.goals_scored },
      ratingChange,
      mvp,
      scorers,
    },
  };
}
