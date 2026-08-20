"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAction } from "@/lib/admin-guard";
import { createClient } from "@/lib/supabase/route-handler";
import type { DisputeResolution } from "@/lib/admin-queues-data";

/**
 * Mutaciones de los tres módulos de gestión.
 *
 * Van por Server Action y no por Route Handler (el patrón de
 * `api/admin/reports/[id]`) por dos razones: no hace falta exponer una
 * superficie HTTP nueva para algo que sólo consume esta UI, y el guard de
 * admin se reusa sin el ida y vuelta de `fetch` + parseo de JSON. Los Route
 * Handlers existentes se quedan como están; no vale la pena migrarlos en este
 * hito.
 *
 * Cada acción devuelve `ActionResult` en vez de tirar: el componente necesita
 * el mensaje para el toast, y una excepción en una Server Action llega al
 * cliente como un error genérico y ofuscado en producción.
 */
export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Valida que el string sea una fecha ISO real, no sólo que matchee el patrón.
 * El round-trip descarta cosas como `2027-02-31`, que pasa el regex pero
 * Postgres rechaza — mejor decírselo al admin acá que devolverle un error de
 * la base.
 */
function isValidISODate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

// ─── Temporadas ──────────────────────────────────────────────────────────────

export async function transitionSeasonAction(input: {
  name: string;
  startsAt: string;
  endsAt: string;
  /** Nombre de la temporada activa, tal como lo tipeó el admin para confirmar. */
  confirmation: string;
  /** Nombre real de la temporada activa, o null si no hay ninguna. */
  activeSeasonName: string | null;
}): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return { ok: false, error: auth.error };

  const name = input.name.trim();

  if (!name) return { ok: false, error: "Ingresá el nombre de la nueva temporada." };
  if (!isValidISODate(input.startsAt)) {
    return { ok: false, error: "La fecha de inicio no es una fecha válida (YYYY-MM-DD)." };
  }
  if (!isValidISODate(input.endsAt)) {
    return { ok: false, error: "La fecha de fin no es una fecha válida (YYYY-MM-DD)." };
  }
  if (input.startsAt >= input.endsAt) {
    return { ok: false, error: "La fecha de inicio debe ser anterior a la de fin." };
  }

  // La confirmación por tipeo se revalida en el servidor y no sólo en el
  // diálogo: es la única acción del dashboard que resetea los contadores de
  // temporada de TODOS los equipos y no tiene marcha atrás. Un cliente
  // manipulado no debería poder saltearla.
  if (input.activeSeasonName && input.confirmation.trim() !== input.activeSeasonName) {
    return {
      ok: false,
      error: `Para confirmar hay que escribir exactamente el nombre de la temporada activa: "${input.activeSeasonName}".`,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("transition_season", {
    p_new_name: name,
    p_starts_at: input.startsAt,
    p_ends_at: input.endsAt,
  });

  if (error) {
    console.error("[admin] transition_season falló:", error.message);
    return { ok: false, error: error.message };
  }

  console.info(
    `[admin] transición de temporada ejecutada por ${auth.session.profile.username}: "${name}" (${input.startsAt} → ${input.endsAt})`,
  );

  revalidatePath("/dashboard/seasons");
  revalidatePath("/dashboard");

  return {
    ok: true,
    message: `Comenzó "${name}". Los contadores de temporada quedaron en 0; el Rating y el historial de partidos no se tocaron.`,
  };
}

// ─── Reclamos de WO ──────────────────────────────────────────────────────────

export async function resolveWoClaimAction(input: {
  claimId: string;
  approve: boolean;
  adminNotes?: string | null;
}): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();
  const { error } = await supabase.rpc("resolve_wo_claim", {
    p_claim_id: input.claimId,
    p_approve: input.approve,
    // `undefined` = argumento omitido (DEFAULT NULL en la RPC). Mandar
    // string vacío guardaría una nota en blanco en vez de ninguna.
    p_admin_notes: input.adminNotes?.trim() || undefined,
  });

  if (error) {
    console.error("[admin] resolve_wo_claim falló:", error.message);
    return { ok: false, error: error.message };
  }

  console.info(
    `[admin] reclamo de WO ${input.approve ? "aprobado" : "rechazado"} por ${auth.session.profile.username}: ${input.claimId}`,
  );

  revalidatePath("/dashboard/wo-claims");
  revalidatePath("/dashboard");

  return {
    ok: true,
    message: input.approve
      ? "WO aprobado: se aplicó el 3-0 con sus estadísticas, goleadores y MVP."
      : "Reclamo rechazado.",
  };
}

// ─── Disputas ────────────────────────────────────────────────────────────────

const VALID_RESOLUTIONS: readonly DisputeResolution[] = ["WIN_A", "WIN_B", "CANCEL"];

export async function adminResolveDisputeAction(input: {
  matchId: string;
  resolution: DisputeResolution;
  adminNotes?: string | null;
}): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!VALID_RESOLUTIONS.includes(input.resolution)) {
    return { ok: false, error: "Resolución inválida." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_resolve_dispute", {
    p_match_id: input.matchId,
    p_resolution: input.resolution,
    p_admin_notes: input.adminNotes?.trim() || undefined,
  });

  if (error) {
    console.error("[admin] admin_resolve_dispute falló:", error.message);
    return { ok: false, error: error.message };
  }

  console.info(
    `[admin] disputa resuelta por ${auth.session.profile.username}: ${input.matchId} → ${input.resolution}`,
  );

  revalidatePath("/dashboard/disputes");
  revalidatePath("/dashboard");

  return {
    ok: true,
    message:
      input.resolution === "CANCEL"
        ? "El partido fue anulado y no computa."
        : "Partido finalizado: se aplicaron Rating, estadísticas de temporada y Fair Play.",
  };
}
