"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAction } from "@/lib/admin-guard";
import { createClient } from "@/lib/supabase/route-handler";
import type { ActionResult } from "@/lib/admin-queues-actions";

/**
 * Mutación del termómetro de redes sociales: carga manual de un snapshot
 * diario. Mismo patrón que el resto de `lib/*-actions.ts` — Server Action,
 * `ActionResult` en vez de excepciones, `revalidatePath` en vez de
 * `router.refresh()`.
 */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidISODate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** `""` en el input queda como `undefined`: la RPC lo trata como "sin dato", no como 0. */
function toOptionalInt(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
}

export async function saveSocialSnapshotAction(input: {
  accountId: string;
  capturedAt: string;
  followers: string;
  following: string;
  posts: string;
  reach: string;
  views: string;
  profileViews: string;
  engagements: string;
}): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!input.accountId) {
    return { ok: false, error: "Elegí una cuenta." };
  }
  if (!isValidISODate(input.capturedAt)) {
    return { ok: false, error: "La fecha no es válida (YYYY-MM-DD)." };
  }

  // Cada campo es opcional (no todas las redes exponen las mismas métricas),
  // pero si se tipeó algo tiene que ser un entero no negativo — un NaN acá
  // significa "se escribió texto", no "se dejó vacío".
  const fields = {
    p_followers: toOptionalInt(input.followers),
    p_following: toOptionalInt(input.following),
    p_posts: toOptionalInt(input.posts),
    p_reach: toOptionalInt(input.reach),
    p_views: toOptionalInt(input.views),
    p_profile_views: toOptionalInt(input.profileViews),
    p_engagements: toOptionalInt(input.engagements),
  };

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && (Number.isNaN(value) || value < 0)) {
      return { ok: false, error: `El campo ${key.replace("p_", "")} tiene que ser un número entero, 0 o mayor.` };
    }
  }

  if (Object.values(fields).every((v) => v === undefined)) {
    return { ok: false, error: "Cargá al menos una métrica." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("social_snapshot_upsert", {
    p_account_id: input.accountId,
    p_captured_at: input.capturedAt,
    ...fields,
    p_source: "manual",
  });

  if (error) {
    console.error("[social] social_snapshot_upsert falló:", error.message);
    return { ok: false, error: humanizeRpcError(error.message) };
  }

  console.info(
    `[admin] snapshot social cargado por ${auth.session.profile.username}: cuenta ${input.accountId}, ${input.capturedAt}`,
  );

  revalidatePath("/dashboard/social");

  return { ok: true, message: `Snapshot del ${input.capturedAt} guardado.` };
}

function humanizeRpcError(message: string): string {
  if (message.includes("NOT_AUTHORIZED")) return "No tenés permisos para esta acción.";
  if (message.includes("ACCOUNT_NOT_FOUND")) return "La cuenta no existe.";
  if (message.includes("INVALID_DATE")) return "La fecha no puede ser futura.";
  if (message.includes("INVALID_INPUT")) return "Revisá los valores cargados.";
  return message;
}

// ─── Conexión de Instagram (Fase 1, pivot a integración automatizada) ────────

export async function disconnectInstagramAction(accountId: string): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_disconnect_instagram_account", {
    p_account_id: accountId,
  });

  if (error) {
    console.error("[social] admin_disconnect_instagram_account falló:", error.message);
    return { ok: false, error: humanizeRpcError(error.message) };
  }

  console.info(`[admin] Instagram desconectado por ${auth.session.profile.username}: cuenta ${accountId}`);

  revalidatePath("/dashboard/social");

  return {
    ok: true,
    message: "Instagram desconectado. El histórico de seguidores no se borró — sólo dejó de sincronizarse solo.",
  };
}
