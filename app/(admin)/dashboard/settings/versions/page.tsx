import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { VersionForm } from "@/components/admin/VersionForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/ui/PageTransition";

export default async function VersionsPage() {
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
            className="rounded-md border border-neutral-outline px-3 py-2 text-sm font-semibold text-neutral-on-surface transition hover:bg-surface-container"
          >
            ← Configuración
          </Link>
        }
      />

      {error ? (
        <p className="rounded-lg border border-danger-error bg-danger-error-container p-4 text-sm text-danger-on-error-container">
          No se pudieron cargar las versiones: {error.message}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(data ?? []).map((version) => (
            <VersionForm key={version.platform} version={version} />
          ))}
        </div>
      )}
    </PageTransition>
  );
}
