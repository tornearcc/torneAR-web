import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Cliente de Supabase que actúa EN NOMBRE del usuario dueño de un JWT.
 *
 * Es la anon key de siempre más el `Authorization: Bearer <jwt>` del usuario,
 * así que PostgREST lo atiende con el rol `authenticated` y las policies de
 * RLS se aplican enteras — a diferencia de la service role key, que las
 * ignora. Si el token está vencido o es falso, Postgres rechaza la consulta:
 * la seguridad no depende de que este código valide bien.
 *
 * Lo usa `/api/og/share-match`, que la app móvil consume con la sesión del
 * jugador. El rol `authenticated` SÍ tiene GRANT de SELECT sobre
 * `match_goals` y `profiles_public`, que es lo que `anon` no tiene y lo que
 * obligaba a la service key.
 *
 * `persistSession: false` no es opcional acá: el cliente se crea por request
 * con el token de OTRO usuario, y persistir esa sesión en una instancia
 * serverless caliente la filtraría al siguiente request.
 */
export function createBearerTokenClient(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "[supabase/bearer-token] Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createSupabaseClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Extrae el token de un header `Authorization: Bearer <jwt>`.
 *
 * Devuelve `null` en vez de tirar: que falte el header es el caso normal de
 * "alguien abrió la URL en el navegador", no un error del servidor, y el
 * llamador lo convierte en un 401 legible.
 */
export function bearerTokenFrom(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;

  // `Bearer` case-insensitive y con espacios de más tolerados: distintos
  // clientes HTTP lo escriben distinto y rechazar por eso sería un 401
  // imposible de diagnosticar desde el teléfono.
  const match = /^\s*Bearer\s+(.+?)\s*$/i.exec(header);
  return match ? match[1] : null;
}
