import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface AdminSession {
  user: User;
  profile: Profile;
}

// 3 variantes separadas, no `status: "unauthenticated" | "forbidden"` en una
// sola — así el narrowing de TS por `status ===` funciona correctamente en
// cada `if` de requireAdminAuth()/requireAdminApi().
type SessionResolution =
  | { status: "ok"; session: AdminSession }
  | { status: "unauthenticated" }
  | { status: "forbidden" };

/**
 * Usa `getUser()`, no `getSession()`: `getSession()` lee la sesión de la
 * cookie sin revalidarla contra el servidor de Auth, así que no es
 * confiable para una decisión de autorización. `getUser()` sí hace esa
 * llamada de red y confirma que el token todavía es válido.
 */
async function resolveAdminSession(): Promise<SessionResolution> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "unauthenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

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
 * Misma verificación para Route Handlers bajo `api/admin/*` (§4.3: "no
 * pasan por el árbol de layouts de app/, así que no pueden confiar en que
 * el layout ya validó el acceso").
 *
 * NO reutiliza `requireAdminAuth()`: ese `redirect('/login')` produce una
 * respuesta 307 hacia una página HTML. Un `fetch()` de un Client Component
 * sigue redirects por defecto, así que terminaría devolviendo el HTML de
 * `/login` con `res.ok === true` — un fallo de autorización se leería como
 * un éxito. Acá se devuelve un 401/403 en JSON en su lugar.
 *
 * Uso:
 * ```ts
 * const auth = await requireAdminApi();
 * if (auth.response) return auth.response;
 * const { profile } = auth.session;
 * ```
 */
export async function requireAdminApi(): Promise<
  { response: NextResponse; session?: never } | { response?: never; session: AdminSession }
> {
  const result = await resolveAdminSession();

  if (result.status === "unauthenticated") {
    return { response: NextResponse.json({ error: "No autenticado." }, { status: 401 }) };
  }
  if (result.status === "forbidden") {
    return { response: NextResponse.json({ error: "No autorizado." }, { status: 403 }) };
  }

  return { session: result.session };
}
