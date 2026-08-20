import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";

import { requireAdminAuth } from "@/lib/admin-guard";
import { buildAuthorizeUrl } from "@/lib/instagram-oauth";

// Mismo valor que app/api/instagram/oauth/callback/route.ts (ver el
// comentario de esa constante ahí sobre por qué no se comparte por import).
const STATE_COOKIE = "ig_oauth_state";

/**
 * Arranca el consentimiento de Instagram desde "Conectar Instagram" en
 * /dashboard/social. `requireAdminAuth()` redirige solo a /login si no hay
 * sesión de admin — no hace falta repetir ese chequeo acá.
 *
 * El `state` es anti-CSRF: sin él, cualquiera podría mandarle a un admin
 * logueado un link a `.../oauth/callback?code=<code-de-OTRA-cuenta>` y
 * hacerle conectar una cuenta de Instagram ajena a la suya. Va en una
 * cookie httpOnly (el navegador la maneja sola, JS no la puede leer ni
 * falsificar) y el callback la compara contra el `state` que Instagram
 * devuelve.
 */
export async function GET() {
  await requireAdminAuth();

  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();

  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    // 5 minutos: alcanza de sobra para el consentimiento en Instagram y
    // volver. Más que eso sólo alarga la ventana de un CSRF si el valor
    // llegara a filtrarse por algún otro medio.
    maxAge: 300,
    path: "/api/instagram/oauth",
  });

  const authorizeUrl = buildAuthorizeUrl(state);
  return Response.redirect(authorizeUrl);
}
