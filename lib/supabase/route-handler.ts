import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

/**
 * Cliente de Supabase para Route Handlers (`app/**\/route.ts`) y Server
 * Actions. A diferencia de `lib/supabase/server.ts`, acá `setAll` no
 * envuelve en try/catch: en este contexto sí está permitido escribir
 * cookies, así que si `cookieStore.set` tira, es un error real y debe
 * propagarse, no silenciarse.
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
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}
