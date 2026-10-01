import { requireAdminAuth } from "@/lib/admin-guard";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { VersionForm } from "@/components/admin/VersionForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/ui/PageTransition";

export default async function VersionsPage() {
  // Guarda propia además de la del layout: en el App Router corren en
  // paralelo y sin esto la página consulta igual sin sesión (P2-12).
  await requireAdminAuth();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("app_versions")
    .select("platform, min_required_version, latest_version, update_url, updated_at")
    .order("platform");

  return (
    <PageTransition>
      <PageHeader
        title="Versiones"
        description="Force update por plataforma."
        actions={
          <Link
            href="/dashboard/settings"
            className="rounded-md border border-chalk-line px-3 py-2 text-sm font-medium text-chalk transition-colors hover:bg-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chalk"
          >
            Volver a configuración
          </Link>
        }
      />

      {error ? (
        <p className="rounded-md border border-card-red/40 bg-card-red/10 p-4 text-[15px] text-chalk">
          No se pudieron cargar las versiones: {error.message}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-10">
          {(data ?? []).map((version) => (
            <VersionForm key={version.platform} version={version} />
          ))}
        </div>
      )}
    </PageTransition>
  );
}
