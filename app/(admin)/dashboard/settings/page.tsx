import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/ui/PageTransition";

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("app_settings")
    .select("key, value, description, updated_at")
    .order("key");

  return (
    <PageTransition>
      <PageHeader
        title="Configuración"
        description="Parámetros operativos — cambian el comportamiento de la app en vivo, sin deploy."
        actions={
          <Link
            href="/dashboard/settings/versions"
            className="rounded-md border border-neutral-outline px-3 py-2 text-sm font-semibold text-neutral-on-surface transition hover:bg-surface-container"
          >
            Versiones →
          </Link>
        }
      />

      {error ? (
        <p className="rounded-lg border border-danger-error bg-danger-error-container p-4 text-sm text-danger-on-error-container">
          No se pudo cargar la configuración: {error.message}
        </p>
      ) : (
        <SettingsForm settings={data ?? []} />
      )}
    </PageTransition>
  );
}
