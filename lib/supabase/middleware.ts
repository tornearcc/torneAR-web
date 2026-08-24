import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/supabase";

/**
 * Refresca la sesión de Supabase en cada request a `(admin)/*` (ver proxy.ts)
 * y propaga las cookies actualizadas request → response.
 *
 * Host-only por diseño (§5 de WEB_SPECIFICATION.md): nunca se setea
 * `options.domain`. Sin ese atributo, el navegador scopea la cookie
 * exclusivamente al host que respondió — en producción eso es
 * `tornear.vercel.app`, así que `tornear.vercel.app` (la landing pública) nunca
 * puede leer la cookie de sesión del admin. Si algún día se setea
 * `domain: '.tornear.vercel.app'` acá, esa separación deja de ser real.
 * Omitir `domain` también es lo único que funciona sin lógica por-entorno
 * en localhost y en preview de Vercel (`*.vercel.app`) durante desarrollo.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            const hostOnlyOptions = { ...options };
            delete hostOnlyOptions.domain;
            response.cookies.set(name, value, hostOnlyOptions);
          });
        },
      },
    }
  );

  // No agregar lógica entre createServerClient y getUser(): un `return`
  // temprano acá dejaría el token de sesión sin refrescar en ese request.
  await supabase.auth.getUser();

  return response;
}
