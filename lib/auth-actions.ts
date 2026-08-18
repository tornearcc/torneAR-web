"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/route-handler";

/**
 * Server Action del form de /login. No hay signup público en el dashboard
 * (§4.1 de WEB_SPECIFICATION.md) — los admins ya existen como filas en
 * `profiles` con `is_admin = true`.
 */
export async function signInWithPassword(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    redirect("/login?error=1");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=1");
  }

  redirect("/dashboard");
}

/** Usada por el botón "Cerrar sesión" del sidebar y de /unauthorized. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
