import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

/**
 * "Quitar foto" de una denuncia de perfil: sacar la foto DENUNCIADA del perfil
 * (si sigue siendo la actual) y borrar su archivo del bucket `avatars`, sin
 * dejar la denuncia resuelta a medias.
 *
 * Vive fuera de la Server Action para poder correrla contra el Supabase local
 * con un cliente cualquiera (ver scripts/verify-remove-reported-avatar.ts).
 *
 * ── Los pasos ─────────────────────────────────────────────────────────────────
 *   1. `admin_remove_reported_content` apunta a la foto que se denunció
 *      (`content_reports.reported_avatar_path`, migración 20260925120000). Si
 *      sigue siendo la actual, pone `avatar_url = NULL`; si la persona ya la
 *      cambió, no toca el perfil. En los dos casos registra el path en
 *      `app_logs` (`removed_avatar_path`, `removed_from_profile`). NO marca
 *      la denuncia: queda PENDING (migración 20260924140000).
 *   2. Se lee ese path del registro de auditoría.
 *   3. Se borra el archivo con la Storage API, con la sesión del admin (las
 *      policies "Admins leen/borran avatares" de la misma migración).
 *   4. Recién con el archivo borrado, la denuncia pasa a ACTIONED.
 *
 * Si falla cualquier paso, la denuncia sigue PENDING y el admin reintenta con
 * el mismo botón. En el reintento, la RPC responde AVATAR_ALREADY_REMOVED
 * (nunca vuelve a tocar el perfil: la foto actual puede ser una nueva que
 * nadie denunció) y el flujo sigue desde el paso 2.
 */

export type AvatarRemovalStage = "rpc" | "lookup" | "storage" | "status";

export type AvatarRemovalResult =
  | {
      ok: true;
      /** Objeto borrado del bucket; `null` si la foto era una URL externa. */
      path: string | null;
      /** La foto denunciada seguía en el perfil y se sacó. `false` = la persona ya la había cambiado. */
      removedFromProfile: boolean;
      retried: boolean;
    }
  | { ok: false; stage: AvatarRemovalStage; error: string };

const AVATARS_BUCKET = "avatars";
const PUBLIC_PREFIX = `/storage/v1/object/public/${AVATARS_BUCKET}/`;

/**
 * Path del objeto dentro del bucket a partir de lo que guardaba
 * `profiles.avatar_url`: normalmente ya es el path, pero hay registros viejos
 * con la URL pública completa y seeds con URLs externas.
 *
 * `null` = la foto no vivía en nuestro bucket (URL externa): no hay archivo
 * que borrar, alcanza con haberla sacado del perfil.
 */
export function avatarObjectPath(stored: string): string | null {
  if (!/^https?:\/\//i.test(stored)) return stored.replace(/^\/+/, "");
  const index = stored.indexOf(PUBLIC_PREFIX);
  if (index === -1) return null;
  const path = stored.slice(index + PUBLIC_PREFIX.length).split("?")[0];
  return path ? decodeURIComponent(path) : null;
}

function readRemoval(details: unknown): { path: string | null; removedFromProfile: boolean } {
  if (typeof details !== "object" || details === null) return { path: null, removedFromProfile: true };
  const record = details as Record<string, unknown>;
  const path = typeof record.removed_avatar_path === "string" && record.removed_avatar_path.length > 0
    ? record.removed_avatar_path
    : null;
  // Los registros de 20260924140000 no traen el campo: esa versión siempre
  // sacaba la foto del perfil.
  return { path, removedFromProfile: record.removed_from_profile !== false };
}

export async function removeReportedAvatar(
  supabase: SupabaseClient<Database>,
  input: { reportId: string; adminAuthUserId: string },
): Promise<AvatarRemovalResult> {
  const { reportId, adminAuthUserId } = input;

  // ── 1. Sacar la foto del perfil ────────────────────────────────────────────
  const { error: rpcError } = await supabase.rpc("admin_remove_reported_content", {
    p_report_id: reportId,
  });
  const retried = rpcError?.message.includes("AVATAR_ALREADY_REMOVED") ?? false;
  if (rpcError && !retried) {
    return { ok: false, stage: "rpc", error: rpcError.message };
  }

  // ── 2. Path del registro de auditoría ──────────────────────────────────────
  const { data: log, error: logError } = await supabase
    .from("app_logs")
    .select("details")
    .eq("message", "admin.remove_reported_content")
    .eq("details->>report_id", reportId)
    .eq("details->>action", "avatar_removed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (logError) return { ok: false, stage: "lookup", error: logError.message };
  const { path: storedPath, removedFromProfile } = readRemoval(log?.details);
  if (!storedPath) {
    return {
      ok: false,
      stage: "lookup",
      error: "No se encontró el registro de la foto quitada para esta denuncia.",
    };
  }

  // ── 3. Borrar el archivo ───────────────────────────────────────────────────
  const path = avatarObjectPath(storedPath);
  if (path) {
    const bucket = supabase.storage.from(AVATARS_BUCKET);
    const { data: removed, error: removeError } = await bucket.remove([path]);
    if (removeError) return { ok: false, stage: "storage", error: removeError.message };

    // `remove` responde éxito con una lista vacía tanto si el archivo no
    // existía como si la policy no dejó borrarlo. Se da por borrado si la
    // respuesta lo nombra, o —en un reintento, cuando ya pudo haberse borrado
    // antes— si ya no existe.
    const deleted = (removed ?? []).some((object) => object.name === path);
    if (!deleted) {
      const { data: stillThere } = await bucket.exists(path);
      if (stillThere) {
        return {
          ok: false,
          stage: "storage",
          error: "El archivo de la foto denunciada sigue en el bucket y se puede abrir por URL.",
        };
      }
    }
  }

  // ── 4. Recién ahora, la denuncia se resuelve ───────────────────────────────
  const { data: updated, error: statusError } = await supabase
    .from("content_reports")
    .update({ status: "ACTIONED" })
    .eq("id", reportId)
    .select("id")
    .maybeSingle();

  if (statusError) return { ok: false, stage: "status", error: statusError.message };
  if (!updated) return { ok: false, stage: "status", error: "La denuncia no existe." };

  // Auditoría del borrado del archivo. No bloquea: la medida ya se tomó y la
  // RPC dejó su propio registro.
  const { error: auditError } = await supabase.from("app_logs").insert({
    level: "warn",
    message: "admin.remove_reported_avatar_file",
    details: { report_id: reportId, removed_avatar_path: storedPath, deleted_object: path, removed_from_profile: removedFromProfile, retried },
    user_id: adminAuthUserId,
  });
  if (auditError) {
    console.warn("[admin] no se pudo registrar el borrado del archivo:", auditError.message);
  }

  return { ok: true, path, removedFromProfile, retried };
}
