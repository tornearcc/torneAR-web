"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAction } from "@/lib/admin-guard";
import { removeReportedAvatar, type AvatarRemovalStage } from "@/lib/avatar-removal";
import { createClient } from "@/lib/supabase/route-handler";
import type { ActionResult } from "@/lib/admin-queues-actions";
import type { Database } from "@/types/supabase";

/**
 * Mutaciones de moderación, configuración, versiones y usuarios.
 *
 * Reemplazan a los Route Handlers de `app/api/admin/*`, que quedaron
 * eliminados. Unifican el patrón con el de `admin-queues-actions.ts`: una
 * Server Action por operación, `ActionResult` en vez de excepciones, y
 * `revalidatePath` en lugar de `router.refresh()` desde el cliente.
 *
 * Lo que se gana no es sólo consistencia. Los handlers devolvían JSON que el
 * cliente tenía que parsear y mapear a un status HTTP, y ese mapeo
 * (`statusForRpcError`) traducía el mensaje de la RPC a un número que después
 * se volvía a traducir a un texto genérico en la UI — dos conversiones para
 * terminar mostrando menos información de la que la base había dado. Acá el
 * mensaje viaja entero.
 */

type ReportStatus = Database["public"]["Enums"]["report_status"];

const VALID_REPORT_STATUSES: readonly ReportStatus[] = [
  "PENDING",
  "REVIEWED",
  "DISMISSED",
  "ACTIONED",
];

// `Array.includes` no angosta el tipo por sí solo; un type predicate explícito
// es lo que deja `status` tipado como `ReportStatus` y no como `string`.
function isReportStatus(value: unknown): value is ReportStatus {
  return typeof value === "string" && (VALID_REPORT_STATUSES as readonly string[]).includes(value);
}

// ─── Moderación ──────────────────────────────────────────────────────────────

export async function updateReportStatusAction(input: {
  reportId: string;
  status: string;
}): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!isReportStatus(input.status)) {
    return { ok: false, error: "Estado de denuncia inválido." };
  }

  const supabase = await createClient();

  // La policy de UPDATE de content_reports exige is_admin de nuevo a nivel de
  // fila: cinturón y tirantes con el guard de arriba.
  const { data, error } = await supabase
    .from("content_reports")
    .update({ status: input.status })
    .eq("id", input.reportId)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "La denuncia no existe." };

  revalidatePath("/dashboard/moderation");
  revalidatePath("/dashboard");

  return { ok: true, message: "Denuncia actualizada." };
}

// ─── Suspensión de cuentas ───────────────────────────────────────────────────

/**
 * `profileId` es `profiles.id`, no `auth.users.id`. Las RPCs
 * (`admin_suspend_user` / `admin_unban_user`, migraciones 20260818190000 y
 * 20260819130000) resuelven `auth_user_id` internamente antes de tocar
 * `auth.users`.
 *
 * Deliberadamente NO usa `service_role`: banear pasa por la RPC
 * `SECURITY DEFINER` con la sesión normal del admin (§1.2 de
 * WEB_SPECIFICATION.md — la service_role key nunca llega al navegador).
 */
export async function setUserSuspensionAction(input: {
  profileId: string;
  suspend: boolean;
  reason?: string | null;
}): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();
  const reason = input.reason?.trim() || undefined;

  const { error } = input.suspend
    ? await supabase.rpc("admin_suspend_user", {
        p_profile_id: input.profileId,
        p_reason: reason,
      })
    : await supabase.rpc("admin_unban_user", {
        p_profile_id: input.profileId,
        p_reason: reason,
      });

  if (error) {
    console.error("[admin] suspensión falló:", error.message);
    return { ok: false, error: humanizeRpcError(error.message) };
  }

  console.info(
    `[admin] ${input.suspend ? "suspensión" : "levantamiento"} por ${auth.session.profile.username}: ${input.profileId}`,
  );

  revalidatePath("/dashboard/moderation");
  revalidatePath("/dashboard/users");

  return {
    ok: true,
    message: input.suspend
      ? "Usuario suspendido: pierde el acceso a la app."
      : "Suspensión levantada: el usuario vuelve a tener acceso.",
  };
}

// ─── Eliminación de contenido denunciado ─────────────────────────────────────

/**
 * Elimina el contenido de una denuncia y la deja en ACTIONED.
 *
 * Es la otra mitad de lo que la guideline 1.2 de la App Store exige ante una
 * denuncia: «removing the content and ejecting the user». Suspender ya estaba
 * (`setUserSuspensionAction`); sin esto, el contenido denunciado quedaba
 * publicado aunque la cuenta estuviera suspendida.
 *
 * Qué significa eliminar depende del tipo y lo decide la RPC, no esta acción:
 * un mensaje se borra, una publicación se desactiva —borrarla arrastraría las
 * postulaciones— y de un equipo se neutralizan nombre y escudo, porque su
 * historial deportivo es compartido con los rivales. Ver la migración
 * 20260911170000.
 *
 * Mismo criterio que la suspensión: pasa por la RPC `SECURITY DEFINER` con la
 * sesión normal del admin, nunca con `service_role` (§1.2 de
 * WEB_SPECIFICATION.md).
 */
export async function removeReportedContentAction(input: {
  reportId: string;
}): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();

  const { error } = await supabase.rpc("admin_remove_reported_content", {
    p_report_id: input.reportId,
  });

  if (error) {
    console.error("[admin] eliminación de contenido falló:", error.message);
    return { ok: false, error: humanizeRpcError(error.message) };
  }

  console.info(
    `[admin] contenido eliminado por ${auth.session.profile.username}: denuncia ${input.reportId}`,
  );

  revalidatePath("/dashboard/moderation");
  revalidatePath("/dashboard");

  return { ok: true, message: "Contenido eliminado y denuncia marcada como accionada." };
}

/**
 * "Quitar foto" en una denuncia de perfil: saca la foto del perfil y borra el
 * archivo del bucket `avatars`. La denuncia pasa a ACTIONED sólo si el
 * archivo quedó borrado; si falla algo en el medio queda PENDING y el mismo
 * botón reintenta sin volver a tocar el perfil. El detalle de los pasos está
 * en `lib/avatar-removal.ts`.
 *
 * Igual que el resto: sesión del admin, nunca `service_role`. El borrado del
 * archivo pasa por las policies "Admins leen/borran avatares"
 * (migración 20260924140000).
 */
export async function removeReportedAvatarAction(input: {
  reportId: string;
}): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();
  const result = await removeReportedAvatar(supabase, {
    reportId: input.reportId,
    adminAuthUserId: auth.session.user.id,
  });

  if (!result.ok) {
    console.error(`[admin] quitar foto falló en "${result.stage}":`, result.error);
    return { ok: false, error: avatarRemovalErrorMessage(result.stage, result.error) };
  }

  console.info(
    `[admin] foto quitada por ${auth.session.profile.username}: denuncia ${input.reportId}` +
      (result.retried ? " (reintento del borrado del archivo)" : ""),
  );

  revalidatePath("/dashboard/moderation");
  revalidatePath("/dashboard");

  return {
    ok: true,
    message: avatarRemovalSuccessMessage(result.path !== null, result.removedFromProfile),
  };
}

/**
 * Qué pasó con el perfil y con el archivo. Desde 20260925120000 "Quitar foto"
 * apunta a la foto denunciada: si la persona ya la había cambiado, el perfil
 * no se toca y sólo se borra el archivo viejo.
 */
function avatarRemovalSuccessMessage(hadFile: boolean, removedFromProfile: boolean): string {
  const profile = removedFromProfile
    ? "La foto denunciada se quitó del perfil"
    : "La persona ya había cambiado la foto: el perfil no se tocó";
  const file = hadFile
    ? "y se borró el archivo del bucket"
    : "(era una URL externa: no había archivo en el bucket)";
  return `${profile} ${file}. Denuncia marcada como accionada.`;
}

/**
 * Qué decirle al admin según dónde se cortó. Salvo en `rpc`, la foto
 * denunciada ya no está en el perfil (o nunca estuvo, si la persona la había
 * cambiado): lo que falta es el archivo o el cierre de la denuncia, y el mismo
 * botón lo retoma.
 */
function avatarRemovalErrorMessage(stage: AvatarRemovalStage, error: string): string {
  const retry = "La denuncia sigue pendiente: tocá «Quitar foto» de nuevo para reintentar.";
  switch (stage) {
    case "rpc":
      return humanizeRpcError(error);
    case "lookup":
      return `No se pudo leer qué archivo borrar (${error}). ${retry}`;
    case "storage":
      return `El archivo de la foto denunciada no se pudo borrar del bucket (${error}). ${retry}`;
    case "status":
      return `El archivo se borró, pero no se pudo marcar la denuncia (${error}). ${retry}`;
  }
}

// ─── Rol de administrador ────────────────────────────────────────────────────

export async function setAdminFlagAction(input: {
  profileId: string;
  isAdmin: boolean;
  /** Username tipeado en el diálogo, revalidado acá. */
  confirmation: string;
  expectedUsername: string;
}): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return { ok: false, error: auth.error };

  // La confirmación por tipeo se revalida server-side y no sólo en el diálogo:
  // esto es escalación de privilegios, y un cliente manipulado no debería
  // poder saltearla. Las guardas de fondo (no sobre uno mismo, no al último
  // admin) viven igual dentro de la RPC.
  if (input.confirmation.trim() !== input.expectedUsername) {
    return {
      ok: false,
      error: `Para confirmar hay que escribir exactamente el usuario: "${input.expectedUsername}".`,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_admin_flag", {
    p_profile_id: input.profileId,
    p_is_admin: input.isAdmin,
  });

  if (error) {
    console.error("[admin] admin_set_admin_flag falló:", error.message);
    return { ok: false, error: humanizeRpcError(error.message) };
  }

  revalidatePath("/dashboard/users");

  return {
    ok: true,
    message: input.isAdmin
      ? `@${input.expectedUsername} ahora es administrador.`
      : `@${input.expectedUsername} ya no es administrador.`,
  };
}

// ─── Género del perfil (soporte) ─────────────────────────────────────────────

export type ProfileGender = "M" | "F" | "X";

const PROFILE_GENDERS: readonly ProfileGender[] = ["M", "F", "X"];

function isProfileGender(value: unknown): value is ProfileGender {
  return typeof value === "string" && (PROFILE_GENDERS as readonly string[]).includes(value);
}

/**
 * Género actual de un perfil. Desde 20260925160000 (F3) `authenticated` ya no
 * lee `profiles.gender` de otra persona —tampoco un admin con su sesión—, así
 * que se consulta por la RPC `admin_get_profile_gender`, que exige is_admin.
 */
export async function getProfileGenderAction(input: {
  profileId: string;
}): Promise<{ ok: true; gender: ProfileGender | null } | { ok: false; error: string }> {
  const auth = await requireAdminAction();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_get_profile_gender", {
    p_profile_id: input.profileId,
  });

  if (error) return { ok: false, error: humanizeRpcError(error.message) };
  return { ok: true, gender: isProfileGender(data) ? data : null };
}

/**
 * Corrige el género de un perfil a pedido de su titular. En la app se elige
 * una sola vez (trigger `profiles_gender_lock`): ésta es la única vía para
 * cambiarlo después. La RPC exige un motivo y deja `admin.set_profile_gender`
 * en app_logs con el valor anterior y el nuevo.
 */
export async function setProfileGenderAction(input: {
  profileId: string;
  gender: string;
  reason: string;
}): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!isProfileGender(input.gender)) {
    return { ok: false, error: "Elegí Masculino, Femenino u Otro." };
  }
  const reason = input.reason.trim();
  if (!reason) return { ok: false, error: "Indicá el motivo del cambio." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_set_profile_gender", {
    p_profile_id: input.profileId,
    p_gender: input.gender,
    p_reason: reason,
  });

  if (error) {
    console.error("[admin] cambio de género falló:", error.message);
    return { ok: false, error: humanizeRpcError(error.message) };
  }

  const changed = (data as { changed?: unknown } | null)?.changed === true;
  console.info(
    `[admin] género ${changed ? "corregido" : "sin cambios"} por ${auth.session.profile.username}: ${input.profileId}`,
  );

  revalidatePath("/dashboard/users");

  return {
    ok: true,
    message: changed
      ? "Género corregido. Queda registrado en los logs."
      : "El perfil ya tenía ese género: no se cambió nada.",
  };
}

// ─── Configuración ───────────────────────────────────────────────────────────

export async function updateSettingAction(input: {
  key: string;
  value: number;
}): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!Number.isFinite(input.value)) {
    return { ok: false, error: "El valor tiene que ser un número." };
  }

  const supabase = await createClient();

  // El GRANT de app_settings sólo permite UPDATE(value) — ni con is_admin se
  // puede tocar `description` desde acá (migración 20260818180000).
  const { data, error } = await supabase
    .from("app_settings")
    .update({ value: input.value })
    .eq("key", input.key)
    .select("key")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "El parámetro no existe." };

  revalidatePath("/dashboard/settings");

  return { ok: true, message: `"${input.key}" actualizado a ${input.value}.` };
}

// ─── Versiones ───────────────────────────────────────────────────────────────

const VALID_PLATFORMS = ["ios", "android"] as const;
type Platform = (typeof VALID_PLATFORMS)[number];

const EDITABLE_VERSION_FIELDS = [
  "min_required_version",
  "latest_version",
  "update_url",
] as const;

export async function updateVersionAction(input: {
  platform: string;
  fields: Partial<Record<(typeof EDITABLE_VERSION_FIELDS)[number], string>>;
}): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!(VALID_PLATFORMS as readonly string[]).includes(input.platform)) {
    return { ok: false, error: "La plataforma debe ser ios o android." };
  }

  // Tipado como el `Update` de la tabla y no como `Record<string, string>`:
  // el cliente de Supabase rechaza propiedades que no existan en la tabla, y
  // un índice de string genérico las permitiría todas.
  const update: Database["public"]["Tables"]["app_versions"]["Update"] = {};
  for (const field of EDITABLE_VERSION_FIELDS) {
    const value = input.fields[field];
    if (value === undefined) continue;
    if (typeof value !== "string" || value.trim() === "") {
      return { ok: false, error: `${field} debe ser un texto no vacío.` };
    }
    update[field] = value.trim();
  }

  if (Object.keys(update).length === 0) {
    return { ok: false, error: "No hay ningún campo para actualizar." };
  }

  const supabase = await createClient();

  // Los CHECK de la tabla (semver-lite y update_url ~ '^https://', migración
  // 20260804122000) son la validación real de fondo; lo de arriba sólo filtra
  // basura obvia para devolver un mensaje más claro que un CHECK crudo.
  const { data, error } = await supabase
    .from("app_versions")
    .update(update)
    .eq("platform", input.platform as Platform)
    .select("platform")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "La plataforma no existe." };

  revalidatePath("/dashboard/settings/versions");

  return { ok: true, message: `Versiones de ${input.platform} actualizadas.` };
}

/**
 * Traduce los prefijos estables de error de las RPCs a algo legible.
 *
 * Las RPCs del proyecto comunican el tipo de error con un prefijo en el
 * mensaje (misma convención que `checkin_team`: `MATCH_NOT_FOUND`,
 * `LOCATION_REQUIRED`, etc.). Se mapean los conocidos y se deja pasar el resto
 * tal cual — un mensaje crudo es más útil que un "algo salió mal".
 */
function humanizeRpcError(message: string): string {
  if (message.includes("NOT_AUTHORIZED")) return "No tenés permisos para esta acción.";
  if (message.includes("PROFILE_NOT_FOUND")) return "El perfil no existe.";
  if (message.includes("CANNOT_SUSPEND_SELF")) return "No podés suspenderte a vos mismo.";
  if (message.includes("CANNOT_CHANGE_SELF")) {
    return "No podés cambiar tu propio rol de administrador.";
  }
  if (message.includes("LAST_ADMIN")) {
    return "No se puede revocar al último administrador que queda.";
  }
  if (message.includes("REPORT_NOT_FOUND")) return "La denuncia ya no existe.";
  if (message.includes("INVALID_GENDER")) return "Elegí Masculino, Femenino u Otro.";
  if (message.includes("REASON_REQUIRED")) return "Indicá el motivo del cambio.";
  if (message.includes("NO_CONTENT_TO_REMOVE")) {
    return "Esta denuncia no tiene contenido que eliminar (en un perfil: no tiene foto). La medida acá es suspender la cuenta.";
  }
  if (message.includes("INVALID_AVATAR_PATH")) {
    return "La foto registrada en la denuncia no es de la carpeta del perfil denunciado. No se borró nada: revisá la denuncia a mano.";
  }
  return message;
}
