import { requireAdminAuth } from "@/lib/admin-guard";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/ui/PageTransition";

export default async function SettingsPage() {
  // Guarda propia además de la del layout: en el App Router corren en
  // paralelo y sin esto la página consulta igual sin sesión (P2-12).
  await requireAdminAuth();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("app_settings")
    .select("key, value, description, updated_at")
    .order("key");

  return (
    <PageTransition>
      <PageHeader
        title="Configuración"
        description="Parámetros operativos. Cambian el comportamiento de la app en vivo, sin deploy."
        actions={
          <Link
            href="/dashboard/settings/versions"
            className="rounded-md border border-chalk-line px-3 py-2 text-sm font-medium text-chalk transition-colors hover:bg-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chalk"
          >
            Versiones de la app
          </Link>
        }
      />

      {error ? (
        <p className="rounded-md border border-card-red/40 bg-card-red/10 p-4 text-[15px] text-chalk">
          No se pudo cargar la configuración: {error.message}
        </p>
      ) : (
        <SettingsForm settings={data ?? []} />
      )}
    </PageTransition>
  );
}
