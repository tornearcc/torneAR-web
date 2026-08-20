import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { requireAdminAction } from "@/lib/admin-guard";
import { createClient } from "@/lib/supabase/route-handler";
import {
  exchangeCodeForShortLivedToken,
  exchangeForLongLivedToken,
  fetchInstagramProfile,
} from "@/lib/instagram-oauth";

// Mismo valor que app/api/instagram/oauth/start/route.ts. No se importa de
// ahí a propósito: Next valida qué exports son válidos en un `route.ts`
// (sólo verbos HTTP y un puñado de config especiales), y este archivo no
// necesita acoplarse al de al lado por una sola constante literal.
const STATE_COOKIE = "ig_oauth_state";

/**
 * Vuelve acá Instagram después del consentimiento. Hace los 3 pasos del
 * exchange (código → token corto → token largo → perfil) y guarda todo vía
 * `admin_connect_instagram_account` — nunca escribe el token directo a una
 * tabla, esa RPC es la única vía (ver 20260819230000).
 *
 * Siempre redirige a /dashboard/social con `?instagram=connected` o
 * `?instagram=error&reason=...` — nunca deja al admin en una pantalla en
 * blanco ni le muestra un JSON crudo, incluso si algo de la cadena falla.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  function redirectTo(query: string) {
    return NextResponse.redirect(`${origin}/dashboard/social?${query}`);
  }
  function redirectError(reason: string) {
    return redirectTo(`instagram=error&reason=${encodeURIComponent(reason)}`);
  }

  const auth = await requireAdminAction();
  if (!auth.ok) {
    return redirectError(auth.error);
  }

  // Instagram devuelve el error del USUARIO acá (canceló el consentimiento,
  // etc.) en vez de `code` — distinto de un error nuestro de red/RPC.
  const oauthError = searchParams.get("error_description") ?? searchParams.get("error");
  if (oauthError) {
    return redirectError(oauthError);
  }

  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  if (!code || !returnedState || !expectedState || returnedState !== expectedState) {
    return redirectError("El enlace de conexión venció o no es válido. Probá conectar de nuevo.");
  }

  try {
    const shortLived = await exchangeCodeForShortLivedToken(code);
    const longLived = await exchangeForLongLivedToken(shortLived.accessToken);
    const profile = await fetchInstagramProfile(longLived.accessToken);

    const supabase = await createClient();

    // La fila ya existe desde el sembrado de Fase 1 (una por plataforma) —
    // esta RPC conecta esa fila, no crea una cuenta nueva.
    const { data: account, error: accountError } = await supabase
      .from("social_accounts")
      .select("id")
      .eq("platform", "instagram")
      .maybeSingle();

    if (accountError || !account) {
      return redirectError("No existe la cuenta de Instagram en social_accounts. Revisá el sembrado de Fase 1.");
    }

    const { error: connectError } = await supabase.rpc("admin_connect_instagram_account", {
      p_account_id: account.id,
      p_ig_user_id: profile.userId,
      p_username: profile.username,
      p_access_token: longLived.accessToken,
      p_expires_in_seconds: longLived.expiresIn,
    });

    if (connectError) {
      console.error("[instagram-oauth] admin_connect_instagram_account falló:", connectError.message);
      return redirectError(connectError.message);
    }

    return redirectTo("instagram=connected");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido conectando Instagram.";
    console.error("[instagram-oauth] callback falló:", error);
    return redirectError(message);
  }
}
