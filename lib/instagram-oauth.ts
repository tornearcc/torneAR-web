/**
 * Cliente puro de OAuth de "Instagram API with Instagram Login" (Business
 * Login) — no la Basic Display API, deprecada desde dic-2024. Server-only:
 * usa `INSTAGRAM_APP_SECRET`, que nunca puede llegar al navegador.
 *
 * Tres endpoints, tres formatos de request distintos (así es la API real,
 * no una elección de diseño acá):
 *   1. Autorización: redirect de navegador, GET con query params.
 *   2. Código → token corto: POST con body `x-www-form-urlencoded`.
 *   3. Token corto → largo / refresh: GET con query params, sobre
 *      graph.instagram.com (host distinto de api.instagram.com).
 *
 * Scope: `instagram_business_basic` — es el único permiso que hace falta
 * para leer `followers_count`/`follows_count`/`media_count` del propio
 * perfil. No se pide nada de `instagram_business_content_publish` ni
 * `_manage_comments`: no hace falta para el termómetro, y pedir permisos de
 * más sólo hace más lento el review de Meta el día que la app deje de ser
 * de uso interno.
 */

const AUTHORIZE_URL = "https://api.instagram.com/oauth/authorize";
const SHORT_LIVED_TOKEN_URL = "https://api.instagram.com/oauth/access_token";
const GRAPH_BASE = "https://graph.instagram.com";
const SCOPES = "instagram_business_basic";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[instagram-oauth] falta la variable de entorno ${name}.`);
  }
  return value;
}

export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("INSTAGRAM_APP_ID"),
    redirect_uri: requireEnv("INSTAGRAM_OAUTH_REDIRECT_URI"),
    scope: SCOPES,
    response_type: "code",
    state,
  });

  return `${AUTHORIZE_URL}?${params.toString()}`;
}

export interface ShortLivedToken {
  accessToken: string;
  userId: string;
}

/** Código de `?code=` → token corto (válido 1h). Único paso que es POST form-encoded. */
export async function exchangeCodeForShortLivedToken(code: string): Promise<ShortLivedToken> {
  const body = new URLSearchParams({
    client_id: requireEnv("INSTAGRAM_APP_ID"),
    client_secret: requireEnv("INSTAGRAM_APP_SECRET"),
    grant_type: "authorization_code",
    redirect_uri: requireEnv("INSTAGRAM_OAUTH_REDIRECT_URI"),
    code,
  });

  const res = await fetch(SHORT_LIVED_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = (await res.json().catch(() => null)) as
    | { access_token?: string; user_id?: number | string; error_message?: string }
    | null;

  if (!res.ok || !json?.access_token) {
    throw new Error(json?.error_message ?? `No se pudo canjear el código de autorización (HTTP ${res.status}).`);
  }

  return { accessToken: json.access_token, userId: String(json.user_id ?? "") };
}

export interface LongLivedToken {
  accessToken: string;
  /** Segundos hasta el vencimiento — típicamente 60 días. */
  expiresIn: number;
}

/** Token corto (1h) → token de larga duración (~60 días). */
export async function exchangeForLongLivedToken(shortLivedToken: string): Promise<LongLivedToken> {
  const params = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: requireEnv("INSTAGRAM_APP_SECRET"),
    access_token: shortLivedToken,
  });

  const res = await fetch(`${GRAPH_BASE}/access_token?${params.toString()}`);
  const json = (await res.json().catch(() => null)) as
    | { access_token?: string; expires_in?: number; error?: { message?: string } }
    | null;

  if (!res.ok || !json?.access_token || !json.expires_in) {
    throw new Error(
      json?.error?.message ?? `No se pudo obtener el token de larga duración (HTTP ${res.status}).`,
    );
  }

  return { accessToken: json.access_token, expiresIn: json.expires_in };
}

export interface InstagramProfile {
  userId: string;
  username: string;
}

/** Perfil de la cuenta conectada — confirma que el token funciona y trae el @ real. */
export async function fetchInstagramProfile(accessToken: string): Promise<InstagramProfile> {
  const params = new URLSearchParams({ fields: "user_id,username", access_token: accessToken });
  const res = await fetch(`${GRAPH_BASE}/me?${params.toString()}`);
  const json = (await res.json().catch(() => null)) as
    | { user_id?: number | string; username?: string; error?: { message?: string } }
    | null;

  if (!res.ok || !json?.user_id) {
    throw new Error(json?.error?.message ?? `No se pudo leer el perfil de Instagram (HTTP ${res.status}).`);
  }

  return { userId: String(json.user_id), username: json.username ?? "" };
}
