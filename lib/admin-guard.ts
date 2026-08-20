import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

// Sólo las columnas que este guard y sus consumidores (AdminSidebar) usan
// de verdad — y las únicas que la migración 20260819100000 dejó con GRANT
// de columna para `authenticated`. Pedir el `Row` completo tiparía campos
// (`date_of_birth`, `expo_push_token`) que la base ya no deja leer.
type AdminProfile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "is_admin" | "username"
>;

export interface AdminSession {
  user: User;
  profile: AdminProfile;
}

// 3 variantes separadas, no `status: "unauthenticated" | "forbidden"` en una
// sola — así el narrowing de TS por `status ===` funciona correctamente en
// cada `if` de requireAdminAuth()/requireAdminAction().
type SessionResolution =
  | { status: "ok"; session: AdminSession }
  | { status: "unauthenticated" }
  | { status: "forbidden" };

/**
 * Usa `getUser()`, no `getSession()`: `getSession()` lee la sesión de la
 * cookie sin revalidarla contra el servidor de Auth, así que no es
 * confiable para una decisión de autorización. `getUser()` sí hace esa
 * llamada de red y confirma que el token todavía es válido.
 *
 * Importante: un error acá (p.ej. `AuthApiError: Invalid Refresh Token`)
 * significa que la sesión no pudo revalidarse — no que el usuario haya
 * sido verificado y no sea admin. Antes esto no se distinguía: cualquier
 * error se colaba silenciosamente hasta el chequeo de `profile` de abajo,
 * que fallaba también (sin JWT válido, la query de `profiles` corre como
 * anon y no devuelve filas) y el resultado terminaba en "forbidden" →
 * `/unauthorized`, expulsando a un admin legítimo con un mensaje
 * incorrecto ("esta cuenta no tiene privilegios"). Tratarlo como
 * "unauthenticated" → `/login` es lo honesto: un reintento de login emite
 * un access/refresh token nuevos y resuelve el problema.
 */
async function resolveAdminSession(): Promise<SessionResolution> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    if (userError) {
      console.error("[admin-guard] getUser() falló, tratando como sesión no válida:", userError);
    }
    return { status: "unauthenticated" };
  }

  // Nunca `select("*")`: desde 20260819100000, `authenticated` tiene el
  // SELECT de tabla revocado y sólo re-otorgado columna por columna (sin
  // `date_of_birth` ni `expo_push_token`). Un `SELECT *` pide TODAS las
  // columnas de la tabla — incluidas las no otorgadas — y Postgres deniega
  // la query entera con `42501 permission denied for table profiles`,
  // aunque las columnas que sí nos interesan estén perfectamente
  // permitidas. Pedir explícitamente sólo lo otorgado es lo que evita eso.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, is_admin, username")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[admin-guard] Falló la lectura de profiles, tratando como sesión no válida:", profileError);
    return { status: "unauthenticated" };
  }

  if (!profile || !profile.is_admin) {
    return { status: "forbidden" };
  }

  return { status: "ok", session: { user, profile } };
}

/**
 * Punto único de verificación de `is_admin` para Server Components /
 * layouts (§4.3 de WEB_SPECIFICATION.md). Usa `redirect()`, que solo tiene
 * sentido en ese contexto.
 */
export async function requireAdminAuth(): Promise<AdminSession> {
  const result = await resolveAdminSession();

  if (result.status === "unauthenticated") {
    redirect("/login");
  }
  if (result.status === "forbidden") {
    redirect("/unauthorized");
  }

  return result.session;
}

/**
 * Misma verificación para Server Actions.
 *
 * No reutiliza `requireAdminAuth()` porque dentro de una Server Action el
 * `redirect()` lanza una excepción de control de flujo que Next convierte en
 * navegación: el usuario terminaría en `/login` sin que el componente que
 * disparó la acción pueda decir nada — ni un toast de error, ni el botón
 * saliendo del estado de carga. Devolver un resultado tipado deja que la UI
 * muestre el fallo donde el admin está mirando.
 *
 * Esto es defensa en profundidad, no la única barrera: las RPCs de gestión
 * (`transition_season`, `resolve_wo_claim`, `admin_resolve_dispute`,
 * `admin_suspend_user`, `admin_set_admin_flag`) son SECURITY DEFINER y
 * revalidan `is_admin` en Postgres. Si este chequeo fallara, la base sigue
 * rechazando la operación.
 */
export async function requireAdminAction(): Promise<
  { ok: true; session: AdminSession } | { ok: false; error: string }
> {
  const result = await resolveAdminSession();

  if (result.status === "unauthenticated") {
    return { ok: false, error: "Tu sesión expiró. Volvé a iniciar sesión." };
  }
  if (result.status === "forbidden") {
    return { ok: false, error: "Tu cuenta no tiene privilegios de administrador." };
  }

  return { ok: true, session: result.session };
}
