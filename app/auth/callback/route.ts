import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/route-handler";

/**
 * Intercambia el `code` del magic link por una sesión (§4.4 de
 * WEB_SPECIFICATION.md). Vive en `app/auth/callback`, fuera de `(admin)` y
 * `(public)`, porque no pertenece a ninguna de las dos zonas.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=1`);
}
