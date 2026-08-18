import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

/**
 * `middleware.ts` fue renombrado a `proxy.ts` en Next.js 16 (mismo
 * comportamiento, solo cambia el nombre del archivo y del export) —
 * ver node_modules/next/dist/docs/.../file-conventions/proxy.md.
 *
 * Responsabilidad única (§4.2 de WEB_SPECIFICATION.md): refrescar el token
 * de sesión de Supabase. La autorización (`is_admin`) se decide en
 * `(admin)/layout.tsx`, no acá, para no duplicar esa query en dos lugares
 * con riesgo de que diverjan.
 */
export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/unauthorized"],
};
