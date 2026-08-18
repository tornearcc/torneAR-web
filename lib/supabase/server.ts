import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

/**
 * Cliente de Supabase para Server Components y Server Actions.
 *
 * `setAll` puede fallar cuando se llama desde un Server Component puro
 * (no se pueden escribir cookies fuera de un Server Action / Route Handler).
 * Se ignora ese error porque `proxy.ts` ya se encarga de refrescar y
 * persistir la sesión en cada request a `(admin)/*` — este cliente solo
 * necesita leer la sesión vigente.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Llamado desde un Server Component — ver comentario de arriba.
          }
        },
      },
    }
  );
}
